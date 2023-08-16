import pushdrop from 'pushdrop'
import { AdmissableOutputs, Output, TopicManager, Transaction } from 'confederacy-base'

/**
 * Implements a topic manager for token management
 * @public
 */
export class TokenTopicManager implements TopicManager {

  /**
   * Returns the outputs from the transaction that are admissible.
   * @public
   * @param object - all params given in an object
   * @param previousUTXOs - any previous UTXOs
   * @param parsedTransaction - transaction containing outputs to admit into the current topic
   * @returns 
   */
  async identifyAdmissibleOutputs({ previousUTXOs, parsedTransaction }: { previousUTXOs: Output[]; parsedTransaction: Transaction }): Promise<number[] | AdmissableOutputs> {
    try {
      const outputsToAdmit: number[] = []
      const outputsToRetain: number[] = []

      // First, we build an object with the assets we are allowed to spend.
      // For each asset, we track the amount we are allowed to spend.
      // It is valid to spend any asset issuance output, with the full amount of the issuance.
      // It is also valid to spend any output with an asset ID, and we add those together across all the previous UTXOs to get the total amount for that asset.
      const maxNumberOfEachAsset = {}
      for (const p of previousUTXOs) {
        const decoded = pushdrop.decode({
          script: typeof p.outputScript === 'string' ? p.outputScript : p.outputScript.toString('hex'),
          fieldFormat: 'utf8'
        })
        let assetId
        if (decoded.fields[0] === 'ISSUE') {
          assetId = `${p.txid}.${p.vout}`
        } else {
          assetId = decoded.fields[0]
        }

        // Track the amounts for previous UTXOs
        if (!maxNumberOfEachAsset[assetId]) {
          maxNumberOfEachAsset[assetId] = {
            amount: Number(decoded.fields[1]),
            metadata: decoded.fields[2]
          }
        } else {
          maxNumberOfEachAsset[assetId].amount += Number(decoded.fields[1])
        }
      }

      // For each output, it is valid as long as either:
      // 1. It is an issuance of a new asset, or
      // 2. The total for that asset does not exceed what's allowed
      // We need an object to track totals for each asset 
      const assetTotals = {}
      for (const i in parsedTransaction.outputs) {
        try {
          const o = parsedTransaction.outputs[i]
          const decoded = pushdrop.decode({
            script: o.script.toHex(),
            fieldFormat: 'utf8'
          })
          const assetId = decoded.fields[0]
          // Issuance outputs are always valid
          if (assetId === 'ISSUE') {
            outputsToAdmit.push(Number(i))
            continue
          }

          // Initialize the asset at 0 if necessary
          if (!assetTotals[assetId]) {
            assetTotals[assetId] = 0
          }
          // Add the amount for this asset
          assetTotals[assetId] += Number(decoded.fields[1])
          // Validate the amount and metadata
          if (!maxNumberOfEachAsset[assetId] || assetTotals[assetId] > maxNumberOfEachAsset[assetId].amount || maxNumberOfEachAsset[assetId].metadata !== decoded.fields[2]) {
            continue
          } else {
            outputsToAdmit.push(Number(i))
          }
        } catch (e) {
          console.error(e)
        }
      }

      for (const p of previousUTXOs) {
        const decodedPrevious = pushdrop.decode({
          script: typeof p.outputScript === 'string' ? p.outputScript : p.outputScript.toString('hex'),
          fieldFormat: 'utf8'
        })
        let assetId
        if (decodedPrevious.fields[0] === 'ISSUE') {
          assetId = `${p.txid}.${p.vout}`
        } else {
          assetId = decodedPrevious.fields[0]
        }
        // Assets included in the inputs but not the admitted outputs are not retained, otherwise they are.
        const assetInOutputs = parsedTransaction.outputs.some((x, i) => {
          if (!outputsToAdmit.includes(i)) {
            return false
          }
          const decodedCurrent = pushdrop.decode({
            script: x.script.toHex(),
            fieldFormat: 'utf8'
          })
          return decodedCurrent.fields[0] === assetId
        })
        if (assetInOutputs) {
          outputsToRetain.push(p.id!)
        }
      }

      return {
        outputsToAdmit,
        outputsToRetain
      }
    } catch (error) {
      return {
        outputsToAdmit: [],
        outputsToRetain: []
      }
    }
  }

  /**
   * Returns the documentation for the tokenization protocol
   */
  async getDocumentation(): Promise<string> {
    return `# Tokens

These tokens are defined by a UTXO-based protocol on top of PushDrop.

First the asset ID is pushed, in the format <txid>.<vout> (hex dot dec) or 'ISSUE" for new assets.

Then the amount is pushed.

Optionally, metadata is pushed. If pushed in the issuance, it must be maintained in all future outputs.

Then the fields are dropped and the P2PK locking script follows.

You can start a new coin by ISSUEing an amount. Then in a subsequent transaction, spend the output as an input, and include the asset ID in any outputs.

The rule is that you cannot have outputs with amounts that total to more than the inputs you are spending from, for any given asset.

The number of satoshis in each output must be at least 1, but beyond that it is not considered.`
  }
}