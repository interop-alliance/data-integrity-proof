/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2022-2024 Digital Bazaar, Inc. All rights reserved.
 */
import type {
  ISigner,
  IVerifier,
  IVerificationResult,
  IVerificationMethod
} from '@interop/data-integrity-core'
import type { IDocumentLoader } from '@interop/data-integrity-core/loader'
import jsigs from '@interop/jsonld-signatures'
import { base58btc, base64url } from './baseX.js'
import { sha256digest } from './sha256digest.js'
import * as util from './util.js'

const {
  suites: { LinkedDataProof }
} = jsigs

// multibase base58-btc header
const MULTIBASE_BASE58BTC_HEADER = 'z'
// multibase base64url no pad header
const MULTIBASE_BASE64URL_HEADER = 'u'
const DATA_INTEGRITY_CONTEXT_V2 = 'https://w3id.org/security/data-integrity/v2'
const DATA_INTEGRITY_CONTEXT_V1 = 'https://w3id.org/security/data-integrity/v1'
const PROOF_TYPE = 'DataIntegrityProof'
// VCDM 2.0 core context
const VC_2_0_CONTEXT = 'https://www.w3.org/ns/credentials/v2'

/**
 * A Data Integrity cryptosuite, as consumed by {@link DataIntegrityProof}.
 */
export interface Cryptosuite {
  canonize: (input: any, options: any) => Promise<string>
  createVerifier: (options: {
    verificationMethod: IVerificationMethod
  }) => Promise<IVerifier>
  name: string
  requiredAlgorithm: string | string[]
  derive?: (options: any) => Promise<any>
  createProofValue?: (options: any) => Promise<string>
  createVerifyData?: (options: any) => Promise<Uint8Array>
}

/**
 * Options for the {@link DataIntegrityProof} constructor.
 */
export interface DataIntegrityProofOptions {
  signer?: ISigner
  date?: string | Date | number | null
  cryptosuite: Cryptosuite
  legacyContext?: boolean
}

/**
 * A `verifyProof()` result, extended with the resolved verification method.
 */
export interface VerifyProofResult extends IVerificationResult {
  verificationMethod?: IVerificationMethod
}

export class DataIntegrityProof extends LinkedDataProof {
  public contextUrl: string
  public canonize: Cryptosuite['canonize']
  public createVerifier: Cryptosuite['createVerifier']
  public cryptosuite: string
  public requiredAlgorithm: string | string[]
  public verificationMethod?: string
  public signer?: ISigner
  public date?: Date | null
  public proof?: any

  private readonly _cryptosuite: Cryptosuite
  private _hashCache?: { document: any; hash: Promise<Uint8Array> }

  /**
   * The constructor for the DataIntegrityProof Class.
   *
   * @param options {object} - Options for the Class.
   * @param [options.signer] {object} - A signer for the suite.
   * @param [options.date] {string|Date|number} - A date to use for `created`.
   * @param options.cryptosuite {object} - A compliant cryptosuite.
   * @param [options.legacyContext=false] {boolean} - Toggles between the
   *   current DI context and a legacy DI context.
   */
  constructor({
    signer,
    date,
    cryptosuite,
    legacyContext = false
  }: DataIntegrityProofOptions) {
    super({ type: PROOF_TYPE })
    const {
      canonize,
      createVerifier,
      name,
      requiredAlgorithm,
      derive,
      createProofValue,
      createVerifyData
    } = cryptosuite
    // `createVerifier` is required
    if (!(createVerifier && typeof createVerifier === 'function')) {
      throw new TypeError('"cryptosuite.createVerifier" must be a function.')
    }
    // assert optional functions
    if (derive && typeof derive !== 'function') {
      throw new TypeError('"cryptosuite.derive" must be a function.')
    }
    if (createProofValue && typeof createProofValue !== 'function') {
      throw new TypeError('"cryptosuite.createProofValue" must be a function.')
    }
    if (createVerifyData && typeof createVerifyData !== 'function') {
      throw new TypeError('"cryptosuite.createVerifyData" must be a function.')
    }
    this.contextUrl = DATA_INTEGRITY_CONTEXT_V2
    if (legacyContext) {
      this.contextUrl = DATA_INTEGRITY_CONTEXT_V1
    }
    this.canonize = canonize
    this.createVerifier = createVerifier
    this.cryptosuite = name
    // save internal reference to cryptosuite instance
    this._cryptosuite = cryptosuite
    this.requiredAlgorithm = requiredAlgorithm
    if (date) {
      this.date = new Date(date)
      if (isNaN(this.date.getTime())) {
        throw TypeError(`"date" "${date}" is not a valid date.`)
      }
    } else if (date === null) {
      this.date = null
    }

    const vm = _processSignatureParams({ signer, requiredAlgorithm })
    this.verificationMethod = vm.verificationMethod
    this.signer = vm.signer
  }

  /**
   * Adds a signature (proofValue) field to the proof object. Called by
   * LinkedDataSignature.createProof().
   *
   * @param options {object} - The options to use.
   * @param options.verifyData {Uint8Array|object} - Data to be signed
   *   (extracted from document, according to the suite's spec).
   * @param options.proof {object} - Proof object (containing the proofPurpose,
   *   verificationMethod, etc).
   *
   * @returns {Promise<object>} Resolves with the proof containing the signature
   *   value.
   */
  async sign({
    verifyData,
    proof
  }: {
    verifyData: Uint8Array
    proof: any
    document?: any
    proofSet?: any[]
    documentLoader?: IDocumentLoader
  }): Promise<any> {
    if (!(this.signer && typeof this.signer.sign === 'function')) {
      throw new Error('A signer API has not been specified.')
    }

    const signatureBytes = await this.signer.sign({ data: verifyData })
    proof.proofValue =
      MULTIBASE_BASE58BTC_HEADER + base58btc.encode(signatureBytes)

    return proof
  }

  /**
   * Verifies the proof signature against the given data.
   *
   * @param options {object} - The options to use.
   * @param options.verifyData {Uint8Array|object} - Verify data as produced
   *   from `createVerifyData`.
   * @param options.verificationMethod {object} - Key object.
   * @param options.proof {object} - The proof to be verified.
   *
   * @returns {Promise<boolean>} Resolves with the verification result.
   */
  async verifySignature({
    verifyData,
    verificationMethod,
    proof
  }: {
    verifyData: Uint8Array
    verificationMethod: IVerificationMethod
    proof: any
  }): Promise<boolean> {
    const verifier = await this.createVerifier({ verificationMethod })
    const isSupportedAlgorithm = Array.isArray(this.requiredAlgorithm)
      ? this.requiredAlgorithm.includes(verifier.algorithm as string)
      : this.requiredAlgorithm === verifier.algorithm

    if (!isSupportedAlgorithm) {
      const supportedAlgorithms = Array.isArray(this.requiredAlgorithm)
        ? this.requiredAlgorithm.join(', ')
        : this.requiredAlgorithm
      const messageSuffix = Array.isArray(this.requiredAlgorithm)
        ? `is not a supported algorithm for the cryptosuite. The supported ` +
          `algorithms are: "${supportedAlgorithms}".`
        : `does not match the required algorithm for the cryptosuite ` +
          `"${supportedAlgorithms}".`
      const message =
        `The verifier's algorithm "${verifier.algorithm}" ` + `${messageSuffix}`
      throw new Error(message)
    }

    const { proofValue } = proof
    if (!(proofValue && typeof proofValue === 'string')) {
      throw new TypeError(
        'The proof does not include a valid "proofValue" property.'
      )
    }
    const multibaseHeader = proofValue[0]
    let signature: Uint8Array
    if (multibaseHeader === MULTIBASE_BASE58BTC_HEADER) {
      signature = base58btc.decode(proofValue.slice(1))
    } else if (multibaseHeader === MULTIBASE_BASE64URL_HEADER) {
      signature = base64url.decode(proofValue.slice(1))
    } else {
      throw new Error(
        'Only base58btc or base64url multibase encoding is supported.'
      )
    }
    return verifier.verify({ data: verifyData, signature })
  }

  /**
   * @param options {object} - The options to use.
   * @param options.document {object} - The document to create a proof for.
   * @param options.purpose {object} - The `ProofPurpose` instance to use.
   * @param options.proofSet {Array} - Any existing proof set.
   * @param options.documentLoader {Function} - The document loader to use.
   *
   * @returns {Promise<object>} Resolves with the created proof object.
   */
  async createProof({
    document,
    purpose,
    proofSet,
    documentLoader
  }: {
    document: any
    purpose: any
    proofSet?: any[]
    documentLoader: IDocumentLoader
  }): Promise<any> {
    // build proof (currently known as `signature options` in spec)
    let proof: any
    if (this.proof) {
      // shallow copy
      proof = { ...this.proof }
    } else {
      // create proof JSON-LD document
      proof = {}
    }

    // ensure proof type is set
    proof.type = this.type

    // set default `now` date if not given in `proof` or `options`
    let date: Date | string | null | undefined = this.date
    if (proof.created === undefined && date === undefined) {
      date = new Date()
    }

    // ensure date is in string format
    if (date && typeof date !== 'string') {
      date = util.w3cDate(date)
    }

    // add API overrides
    if (date) {
      proof.created = date
    }
    proof.verificationMethod = this.verificationMethod
    proof.cryptosuite = this.cryptosuite

    // add any extensions to proof (mostly for legacy support)
    proof = await this.updateProof({
      document,
      proof,
      purpose,
      proofSet,
      documentLoader
    })

    // allow purpose to update the proof; any terms added to `proof` must have
    // be compatible with its context
    proof = await purpose.update(proof, {
      document,
      suite: this,
      documentLoader
    })

    // create data to sign
    let verifyData: Uint8Array
    // use custom cryptosuite `createVerifyData` if available
    if (this._cryptosuite.createVerifyData) {
      verifyData = await this._cryptosuite.createVerifyData({
        cryptosuite: this._cryptosuite,
        document,
        proof,
        proofSet,
        documentLoader,
        dataIntegrityProof: this
      })
    } else {
      verifyData = await this.createVerifyData({
        document,
        proof,
        proofSet,
        documentLoader
      })
    }

    // use custom `createProofValue` if available
    if (this._cryptosuite.createProofValue) {
      proof.proofValue = await this._cryptosuite.createProofValue({
        cryptosuite: this._cryptosuite,
        verifyData,
        document,
        proof,
        proofSet,
        documentLoader,
        dataIntegrityProof: this
      })
    } else {
      // default to simple signing of data
      proof = await this.sign({
        verifyData,
        document,
        proof,
        proofSet,
        documentLoader
      })
    }

    return proof
  }

  /**
   * @param options {object} - The options to use.
   * @param options.document {object} - The document to derive from.
   * @param options.purpose {object} - The `ProofPurpose` instance to use.
   * @param options.proofSet {Array} - Any existing proof set.
   * @param options.documentLoader {Function} - The document loader to use.
   *
   * @returns {Promise<object>} Resolves with the new document with a new
   *   `proof` field.
   */
  async derive({
    document,
    purpose,
    proofSet,
    documentLoader
  }: {
    document: any
    purpose: any
    proofSet?: any[]
    documentLoader: IDocumentLoader
  }): Promise<any> {
    // delegate entirely to cryptosuite instance
    if (!this._cryptosuite.derive) {
      throw new Error('"cryptosuite.derive" not provided.')
    }
    return this._cryptosuite.derive({
      cryptosuite: this._cryptosuite,
      document,
      purpose,
      proofSet,
      documentLoader,
      dataIntegrityProof: this
    })
  }

  /**
   * @param options {object} - The options to use.
   * @param options.proof {object} - The proof to update.
   *
   * @returns {Promise<object>} Resolves with the created proof object.
   */
  async updateProof({
    proof
  }: {
    proof: any
    document?: any
    purpose?: any
    proofSet?: any[]
    documentLoader?: IDocumentLoader
  }): Promise<any> {
    return proof
  }

  /**
   * @param options {object} - The options to use.
   * @param options.proof {object} - The proof to verify.
   * @param options.proofSet {Array} - Any existing proof set.
   * @param options.document {object} - The document to create a proof for.
   * @param options.documentLoader {Function} - The document loader to use.
   *
   * @returns {Promise<object>} Resolves with the verification result.
   */
  async verifyProof({
    proof,
    proofSet,
    document,
    documentLoader
  }: {
    proof: any
    proofSet?: any[]
    document: any
    documentLoader: IDocumentLoader
  }): Promise<VerifyProofResult> {
    try {
      // fetch verification method
      const verificationMethod = await this.getVerificationMethod({
        proof,
        documentLoader
      })

      // create data to verify
      let verifyData: Uint8Array
      // use custom cryptosuite `createVerifyData` if available
      if (this._cryptosuite.createVerifyData) {
        verifyData = await this._cryptosuite.createVerifyData({
          cryptosuite: this._cryptosuite,
          document,
          proof,
          proofSet,
          documentLoader,
          dataIntegrityProof: this,
          verificationMethod
        })
      } else {
        verifyData = await this.createVerifyData({
          document,
          proof,
          proofSet,
          documentLoader,
          verificationMethod
        })
      }

      // verify signature on data
      const verified = await this.verifySignature({
        verifyData,
        verificationMethod,
        proof
      })
      if (!verified) {
        throw new Error('Invalid signature.')
      }
      if (proof.created !== undefined) {
        if (!util.isW3cDate(proof.created)) {
          throw new Error(
            `"proof.created" ("${proof.created}") ` +
              'must be an XSD dateTimeStamp.'
          )
        }
      }
      if (proof.expires !== undefined) {
        if (!util.isW3cDate(proof.expires)) {
          throw new Error(
            `"proof.expires" ("${proof.expires}") ` +
              'must be an XSD dateTimeStamp.'
          )
        }
      }
      return { verified: true, verificationMethod }
    } catch (err) {
      return { verified: false, error: err as Error }
    }
  }

  /**
   * @param options {object} - The options to use.
   * @param options.document {object} - The document to create verify data for.
   * @param options.proof {object} - The proof to create verify data for.
   * @param options.documentLoader {Function} - The document loader to use.
   *
   * @returns {Promise<Uint8Array|object>} Resolves to the verify data to be
   *   passed to `sign` or `verifySignature`.
   */
  async createVerifyData({
    document,
    proof,
    documentLoader
  }: {
    document: any
    proof: any
    proofSet?: any[]
    documentLoader: IDocumentLoader
    verificationMethod?: IVerificationMethod
  }): Promise<Uint8Array> {
    // get cached document hash
    let cachedDocHash: Promise<Uint8Array>
    const { _hashCache } = this
    if (_hashCache && _hashCache.document === document) {
      cachedDocHash = _hashCache.hash
    } else {
      this._hashCache = {
        document,
        // canonize and hash document
        hash: (cachedDocHash = this.canonize(document, {
          documentLoader,
          base: null,
          safe: true
        }).then(c14nDocument => sha256digest({ string: c14nDocument })))
      }
    }

    // await both c14n proof hash and c14n document hash
    const [proofHash, docHash] = await Promise.all([
      // canonize and hash proof
      this.canonizeProof(proof, { document, documentLoader }).then(
        c14nProofOptions => sha256digest({ string: c14nProofOptions })
      ),
      cachedDocHash
    ])
    // concatenate hash of c14n proof options and hash of c14n document
    return util.concat(proofHash, docHash)
  }

  /**
   * @param options {object} - The options to use.
   * @param options.proof {object} - The proof for which to get the
   *   verification method.
   * @param options.documentLoader {Function} - The document loader to use.
   *
   * @returns {object} - The verificationMethod.
   */
  async getVerificationMethod({
    proof,
    documentLoader
  }: {
    proof: any
    documentLoader: IDocumentLoader
  }): Promise<IVerificationMethod> {
    let verificationMethod = proof.verificationMethod

    if (typeof verificationMethod === 'object') {
      verificationMethod = verificationMethod.id
    }

    if (!verificationMethod) {
      throw new Error('No "verificationMethod" found in proof.')
    }

    const result = await documentLoader(verificationMethod)
    if (!result) {
      throw new Error(
        `Unable to load verification method "${verificationMethod}".`
      )
    }

    const { document } = result
    return (
      typeof document === 'string' ? JSON.parse(document) : document
    ) as IVerificationMethod
  }

  async canonizeProof(
    proof: any,
    {
      documentLoader,
      document
    }: { documentLoader: IDocumentLoader; document: any }
  ): Promise<string> {
    // `proofValue` must not be included in the proof options
    proof = {
      '@context': document['@context'],
      ...proof
    }
    this.ensureSuiteContext({ document: proof, addSuiteContext: true })
    delete proof.proofValue
    return this.canonize(proof, {
      documentLoader,
      safe: true,
      base: null,
      skipExpansion: false
    })
  }

  /**
   * Checks whether a given proof exists in the document.
   *
   * @param options {object} - The options to use.
   * @param options.proof {object} - The proof to match.
   *
   * @returns {Promise<boolean>} Whether a match for the proof was found.
   */
  async matchProof({
    proof
  }: {
    proof: any
    document?: any
    purpose?: any
    documentLoader?: IDocumentLoader
  }): Promise<boolean> {
    const { type, cryptosuite } = proof
    return type === this.type && cryptosuite === this.cryptosuite
  }

  /**
   * Ensures the document to be signed contains the required signature suite
   * specific `@context`, by either adding it (if `addSuiteContext` is true),
   * or throwing an error if it's missing.
   *
   * @param options {object} - Options hashmap.
   * @param options.document {object} - JSON-LD document to be signed.
   * @param options.addSuiteContext {boolean} - Add suite context?
   */
  ensureSuiteContext({
    document,
    addSuiteContext
  }: {
    document: any
    addSuiteContext: boolean
  }): void {
    const { contextUrl } = this

    if (
      _includesContext({ document, contextUrl }) ||
      _includesContext({ document, contextUrl: VC_2_0_CONTEXT })
    ) {
      // document already includes the required context
      return
    }

    if (!addSuiteContext) {
      throw new TypeError(
        `The document to be signed must contain this suite's @context, ` +
          `"${contextUrl}".`
      )
    }

    // enforce the suite's context by adding it to the document
    const existingContext = document['@context'] || []

    document['@context'] = Array.isArray(existingContext)
      ? [...existingContext, contextUrl]
      : [existingContext, contextUrl]
  }
}

/**
 * Tests whether a provided JSON-LD document includes a context URL in its
 * `@context` property.
 *
 * @param options {object} - Options hashmap.
 * @param options.document {object} - A JSON-LD document.
 * @param options.contextUrl {string} - A context URL.
 *
 * @returns {boolean} Returns true if document includes context.
 */
function _includesContext({
  document,
  contextUrl
}: {
  document: any
  contextUrl: string
}): boolean {
  const context = document['@context']
  return (
    context === contextUrl ||
    (Array.isArray(context) && context.includes(contextUrl))
  )
}

/**
 * See constructor docstring for param details.
 *
 * @param options {object} - The options to use.
 * @param options.signer {object} - The signer to use.
 * @param options.requiredAlgorithm {Array|string} - The required algorithm.
 *
 * @returns {object} Validated and initialized signature-related parameters.
 */
function _processSignatureParams({
  signer,
  requiredAlgorithm
}: {
  signer?: ISigner
  requiredAlgorithm: string | string[]
}): { verificationMethod?: string; signer?: ISigner } {
  const vm: { verificationMethod?: string; signer?: ISigner } = {
    verificationMethod: undefined,
    signer: undefined
  }

  if (!signer) {
    return vm
  }

  if (typeof signer.sign !== 'function') {
    throw new TypeError('A signer API has not been specified.')
  }
  const isSupportedAlgorithm = Array.isArray(requiredAlgorithm)
    ? requiredAlgorithm.includes(signer.algorithm as string)
    : requiredAlgorithm === signer.algorithm

  if (!isSupportedAlgorithm) {
    const supportedAlgorithms = Array.isArray(requiredAlgorithm)
      ? requiredAlgorithm.join(', ')
      : requiredAlgorithm
    const messageSuffix = Array.isArray(requiredAlgorithm)
      ? `is not a supported algorithm for the cryptosuite. The supported ` +
        `algorithms are: "${supportedAlgorithms}".`
      : `does not match the required algorithm for the cryptosuite ` +
        `"${supportedAlgorithms}".`
    const message =
      `The signer's algorithm "${signer.algorithm}" ` + `${messageSuffix}`
    throw new Error(message)
  }

  vm.signer = signer
  vm.verificationMethod = signer.id

  return vm
}
