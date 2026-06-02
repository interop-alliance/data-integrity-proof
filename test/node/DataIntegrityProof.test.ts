/*!
 * Copyright (c) 2026 Interop Alliance. All rights reserved.
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
 */
import { beforeAll, describe, expect, it } from 'vitest'
import jsigs from '@interop/jsonld-signatures'
import { eddsaRdfc2022 } from '@interop/ed25519-signature'
import { Ed25519VerificationKey } from '@interop/ed25519-verification-key'
import { DataIntegrityProof } from '../../src/index.js'
import {
  credential,
  credentialWithLegacyContext,
  ed25519MultikeyKeyPair
} from './mock-data.js'
import { documentLoader } from './documentLoader.js'

const {
  purposes: { AssertionProofPurpose }
} = jsigs

describe('DataIntegrityProof', () => {
  describe('exports', () => {
    it('should have proper exports', async () => {
      expect(DataIntegrityProof).toBeDefined()
    })
  })

  describe('constructor', () => {
    it('should fail to instantiate w/ incorrect signer algorithm', async () => {
      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const signer = keyPair.signer()
      signer.algorithm = 'wrong-algorithm'

      let error
      try {
        new DataIntegrityProof({
          signer,
          date,
          cryptosuite: eddsaRdfc2022
        })
      } catch (err) {
        error = err as Error
      }

      const errorMessage =
        `The signer's algorithm "${signer.algorithm}" ` +
        `does not match the required algorithm for the cryptosuite ` +
        `"${eddsaRdfc2022.requiredAlgorithm}".`
      expect(error).toBeDefined()
      expect(error?.message).toBe(errorMessage)
    })
  })

  describe('sign() using multikey key type', () => {
    it('should sign a document with a key pair', async () => {
      const unsignedCredential = { ...credential }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect((signedCredential as any).proof.proofValue).toMatch(/^z/)

      // round-trip verify
      const result = await jsigs.verify(signedCredential, {
        suite: new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 }),
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(result.verified).toBe(true)
    })

    it('should sign a document with legacy context', async () => {
      const unsignedCredential = { ...credentialWithLegacyContext }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022,
        legacyContext: true
      })

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect((signedCredential as any).proof.proofValue).toMatch(/^z/)

      const result = await jsigs.verify(signedCredential, {
        suite: new DataIntegrityProof({
          cryptosuite: eddsaRdfc2022,
          legacyContext: true
        }),
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(result.verified).toBe(true)
    })

    it('should sign with custom "createVerifyData"', async () => {
      const unsignedCredential = { ...credential }
      const customCryptosuite = {
        ...eddsaRdfc2022,
        async createVerifyData({
          document,
          proof,
          proofSet,
          documentLoader,
          dataIntegrityProof
        }: any) {
          // use default
          return dataIntegrityProof.createVerifyData({
            document,
            proof,
            proofSet,
            documentLoader
          })
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: customCryptosuite
      })

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect((signedCredential as any).proof.proofValue).toMatch(/^z/)
    })

    it('should sign with custom "createProofValue"', async () => {
      const unsignedCredential = { ...credential }
      const customCryptosuite = {
        ...eddsaRdfc2022,
        async createProofValue({
          verifyData,
          document,
          proof,
          proofSet,
          documentLoader,
          dataIntegrityProof
        }: any) {
          // use default
          proof = await dataIntegrityProof.sign({
            verifyData,
            document,
            proof,
            proofSet,
            documentLoader
          })
          return proof.proofValue
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: customCryptosuite
      })

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect((signedCredential as any).proof.proofValue).toMatch(/^z/)
    })

    it('should sign with "createVerifyData" + "createProofValue"', async () => {
      const unsignedCredential = { ...credential }
      const customCryptosuite = {
        ...eddsaRdfc2022,
        async createVerifyData({
          document,
          proof,
          proofSet,
          documentLoader,
          dataIntegrityProof
        }: any) {
          // use default
          return dataIntegrityProof.createVerifyData({
            document,
            proof,
            proofSet,
            documentLoader
          })
        },
        async createProofValue({
          verifyData,
          document,
          proof,
          proofSet,
          documentLoader,
          dataIntegrityProof
        }: any) {
          // use default
          proof = await dataIntegrityProof.sign({
            verifyData,
            document,
            proof,
            proofSet,
            documentLoader
          })
          return proof.proofValue
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: customCryptosuite
      })

      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect((signedCredential as any).proof.proofValue).toMatch(/^z/)
    })

    it('passing date:null should remove created from proof', async () => {
      const unsignedCredential = { ...credential }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = null
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      const signedCredential: any = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect(signedCredential.proof.created).toBeUndefined()
    })

    it('created should exist with passed date', async () => {
      const unsignedCredential = { ...credential }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      const signedCredential: any = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential.proof.created).toBeDefined()
    })

    it('created should exist with date not passed', async () => {
      const unsignedCredential = { ...credential }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        cryptosuite: eddsaRdfc2022
      })

      const signedCredential: any = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential.proof.created).toBeDefined()
    })

    it('should fail to sign with undefined term', async () => {
      const unsignedCredential: any = structuredClone(credential)
      unsignedCredential.undefinedTerm = 'foo'

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      let error
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        })
      } catch (err) {
        error = err as Error
      }
      expect(error).toBeDefined()
      expect(error?.name).toBe('jsonld.ValidationError')
    })

    it('should fail to sign with relative type URL', async () => {
      const unsignedCredential: any = structuredClone(credential)
      unsignedCredential.type.push('UndefinedType')

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      let error
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        })
      } catch (err) {
        error = err as Error
      }
      expect(error).toBeDefined()
      expect(error?.name).toBe('jsonld.ValidationError')
    })

    it('should fail to sign with custom "createVerifyData"', async () => {
      const unsignedCredential: any = structuredClone(credential)
      const brokenCryptosuite = {
        ...eddsaRdfc2022,
        async createVerifyData() {
          throw new Error('Invalid createVerifyData')
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: brokenCryptosuite
      })

      let error
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        })
      } catch (err) {
        error = err as Error
      }
      expect(error).toBeDefined()
      expect(error?.message).toBe('Invalid createVerifyData')
    })

    it('should fail to sign with custom "createProofValue"', async () => {
      const unsignedCredential: any = structuredClone(credential)
      const brokenCryptosuite = {
        ...eddsaRdfc2022,
        async createProofValue() {
          throw new Error('Invalid createProofValue')
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: brokenCryptosuite
      })

      let error
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        })
      } catch (err) {
        error = err as Error
      }
      expect(error).toBeDefined()
      expect(error?.message).toBe('Invalid createProofValue')
    })

    it('should throw error if "signer" is not specified', async () => {
      const unsignedCredential = { ...credential }
      let signedCredential
      // no keypair, no signer object given
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        date,
        cryptosuite: eddsaRdfc2022
      })

      let err
      try {
        signedCredential = await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader
        })
      } catch (error) {
        err = error as Error
      }
      expect(signedCredential).toBeUndefined()
      expect(err?.name).toBe('Error')
      expect(err?.message).toBe('A signer API has not been specified.')
    })

    it('should add the suite context by default', async () => {
      const unsignedCredential: any = { ...credential }
      unsignedCredential['@context'] = [
        'https://www.w3.org/2018/credentials/v1',
        {
          AlumniCredential: 'https://schema.org#AlumniCredential',
          alumniOf: 'https://schema.org#alumniOf'
        }
        // do not include the suite-specific context
      ]

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      const signedCredential: any = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })

      expect(signedCredential['@context']).toEqual([
        'https://www.w3.org/2018/credentials/v1',
        {
          AlumniCredential: 'https://schema.org#AlumniCredential',
          alumniOf: 'https://schema.org#alumniOf'
        },
        'https://w3id.org/security/data-integrity/v2'
      ])
    })

    it('should error if no context and addSuiteContext false', async () => {
      const unsignedCredential: any = { ...credential }
      unsignedCredential['@context'] = [
        'https://www.w3.org/2018/credentials/v1',
        {
          AlumniCredential: 'https://schema.org#AlumniCredential',
          alumniOf: 'https://schema.org#alumniOf'
        }
        // do not include the suite-specific context
      ]

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      let err
      try {
        await jsigs.sign(unsignedCredential, {
          suite,
          purpose: new AssertionProofPurpose(),
          documentLoader,
          addSuiteContext: false
        })
      } catch (error) {
        err = error as Error
      }
      expect(err?.name).toBe('TypeError')
      expect(err?.message).toMatch(
        /The document to be signed must contain this suite's @context/
      )
    })
  })

  describe('derive() using multikey key type', () => {
    it('should create a proof with "derive"', async () => {
      const unsignedCredential: any = { ...credential }
      // add `proof` that should not exist in derived output
      unsignedCredential.proof = [{ type: 'urn:fake1' }]
      const customCryptosuite = {
        ...eddsaRdfc2022,
        async derive({
          document,
          purpose,
          proofSet,
          documentLoader,
          dataIntegrityProof
        }: any) {
          // use default
          const proof = await dataIntegrityProof.createProof({
            document,
            purpose,
            proofSet,
            documentLoader
          })
          return {
            ...document,
            proof
          }
        }
      }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: customCryptosuite
      })

      const signedCredential: any = await jsigs.derive(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(signedCredential).toHaveProperty('proof')
      expect(signedCredential.proof.proofValue).toMatch(/^z/)
    })
  })

  describe('verify() using multikey key type', () => {
    let signedCredential: any

    beforeAll(async () => {
      const unsignedCredential = { ...credential }

      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const date = '2022-09-06T21:29:24Z'
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        date,
        cryptosuite: eddsaRdfc2022
      })

      signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
    })

    it('should verify a document', async () => {
      const suite = new DataIntegrityProof({
        cryptosuite: eddsaRdfc2022
      })
      const result = await jsigs.verify(signedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(result.verified).toBe(true)
    })

    it('should fail verification if "proofValue" is not string', async () => {
      const suite = new DataIntegrityProof({
        cryptosuite: eddsaRdfc2022
      })
      const signedCredentialCopy = structuredClone(signedCredential)
      // intentionally modify proofValue type to not be string
      signedCredentialCopy.proof.proofValue = {}

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })

      const error = result.results[0]?.error
      expect(result.verified).toBe(false)
      expect(error?.name).toBe('TypeError')
      expect(error?.message).toBe(
        'The proof does not include a valid "proofValue" property.'
      )
    })

    it('should fail verification if "proofValue" is not given', async () => {
      const suite = new DataIntegrityProof({
        cryptosuite: eddsaRdfc2022
      })
      const signedCredentialCopy = structuredClone(signedCredential)
      // intentionally modify proofValue to be undefined
      signedCredentialCopy.proof.proofValue = undefined

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })

      const error = result.results[0]?.error

      expect(result.verified).toBe(false)
      expect(error?.name).toBe('TypeError')
      expect(error?.message).toBe(
        'The proof does not include a valid "proofValue" property.'
      )
    })

    it('should fail verification if proofValue does not start with "z"', async () => {
      const suite = new DataIntegrityProof({
        cryptosuite: eddsaRdfc2022
      })
      const signedCredentialCopy = structuredClone(signedCredential)
      // intentionally modify proofValue to not start with 'z'
      signedCredentialCopy.proof.proofValue = 'a'

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })

      const { errors } = result.error as any

      expect(result.verified).toBe(false)
      expect(errors[0].name).toBe('Error')
      expect(errors[0].message).toBe(
        'Only base58btc or base64url multibase encoding is supported.'
      )
    })

    it('should fail verification if proof type is not DataIntegrityProof', async () => {
      const suite = new DataIntegrityProof({
        cryptosuite: eddsaRdfc2022
      })
      const signedCredentialCopy = structuredClone(signedCredential)
      // intentionally modify proof type to be InvalidSignature2100
      signedCredentialCopy.proof.type = 'InvalidSignature2100'

      const result = await jsigs.verify(signedCredentialCopy, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })

      const { errors } = result.error as any

      expect(result.verified).toBe(false)
      expect(errors[0].name).toBe('NotFoundError')
    })

    it('should fail verification if proof created is not XMLSCHEMA11-2', async () => {
      const unsignedCredential = structuredClone(credential)
      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        cryptosuite: eddsaRdfc2022
      })
      // inject a non-XSD `created` value into the signed proof options
      suite.proof = { created: 'May-23-2022' }
      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      const result = await jsigs.verify(signedCredential, {
        suite: new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 }),
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(result).toBeDefined()
      expect(result.verified).toBeDefined()
      expect(result.verified).toBe(false)
    })

    it('should fail verification if proof expires is not XMLSCHEMA11-2', async () => {
      const unsignedCredential = structuredClone(credential)
      const keyPair = await Ed25519VerificationKey.from({
        ...ed25519MultikeyKeyPair
      })
      const suite = new DataIntegrityProof({
        signer: keyPair.signer(),
        cryptosuite: eddsaRdfc2022
      })
      const plus5Years = new Date().getFullYear() + 5
      suite.proof = { expires: `May-23-${plus5Years}` }
      const signedCredential = await jsigs.sign(unsignedCredential, {
        suite,
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      const result = await jsigs.verify(signedCredential, {
        suite: new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 }),
        purpose: new AssertionProofPurpose(),
        documentLoader
      })
      expect(result).toBeDefined()
      expect(result.verified).toBeDefined()
      expect(result.verified).toBe(false)
    })
  })
})
