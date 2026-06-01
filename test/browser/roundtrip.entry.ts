/**
 * Browser entry module for the full sign/verify roundtrip Playwright test.
 *
 * The bare-specifier imports (`@interop/...`) are rewritten by the Vite dev
 * server when it serves and transforms this module, which is why the Playwright
 * test imports this single served URL rather than importing the packages
 * directly inside `page.evaluate` (where no Vite transform runs).
 */
import { DataIntegrityProof } from '../../src/index.js'
import { eddsaRdfc2022 } from '@interop/ed25519-signature'
import { Ed25519VerificationKey } from '@interop/ed25519-verification-key'
import jsigs from '@interop/jsonld-signatures'
import { documentLoader } from '../node/documentLoader.js'
import { credential, ed25519MultikeyKeyPair } from '../node/mock-data.js'

export async function runRoundtrip(): Promise<{
  proofValue: string
  verified: boolean
}> {
  const keyPair = await Ed25519VerificationKey.from({ ...ed25519MultikeyKeyPair })
  const suite = new DataIntegrityProof({
    signer: keyPair.signer(),
    date: '2022-09-06T21:29:24Z',
    cryptosuite: eddsaRdfc2022
  })
  const signed: any = await jsigs.sign(
    { ...credential },
    {
      suite,
      purpose: new jsigs.purposes.AssertionProofPurpose(),
      documentLoader
    }
  )
  const verifyResult = await jsigs.verify(signed, {
    suite: new DataIntegrityProof({ cryptosuite: eddsaRdfc2022 }),
    purpose: new jsigs.purposes.AssertionProofPurpose(),
    documentLoader
  })
  return {
    proofValue: signed.proof?.proofValue,
    verified: verifyResult.verified
  }
}
