import pushdrop from 'pushdrop'
import { LookupService } from 'confederacy-base'

/**
 * Implements a lookup service for tokens
 * @public
 */
export class TokenLookupService implements LookupService {
    public storageEngine
    public topics: String[]

    constructor ({ storageEngine, topics = [] }) {
    this.storageEngine = storageEngine
    this.topics = topics
  }

  /**
   * Notifies the lookup service of a new output added.
   * @param {Object} obj all params are given in an object
   * @param {string} obj.txid the transactionId of the transaction this UTXO is apart of
   * @param {Number} obj.vout index of the output
   * @param {Buffer} obj.outputScript the outputScript data for the given UTXO
   * @returns {string} indicating the success status
   */
  async outputAdded ({ txid, vout, outputScript, topic }) {
    if (!this.topics.includes(topic)) return
    // Decode the KVStore fields from the Bitcoin outputScript
    const result = pushdrop.decode({
      script: outputScript.toHex(),
      fieldFormat: 'buffer'
    })

    // data to store
    let assetId = result.fields[0].toString('utf8')
    if (assetId === 'ISSUE') {
      assetId = `${txid}.${vout}`
    }
    const amount = Number(result.fields[1].toString('utf8'))

    // Store TSP fields in the StorageEngine
    await this.storageEngine.storeRecord({
      txid,
      vout,
      amount,
      assetId,
      ownerKey: result.lockingPublicKey
    })
  }

  /**
   * Deletes the output record once the UTXO has been spent
   * @param {ob} obj all params given inside an object
   * @param {string} obj.txid the transactionId the transaction the UTXO is apart of
   * @param {Number} obj.vout the index of the given UTXO
   * @param {string} obj.topic the topic this UTXO is apart of
   * @returns
   */
  async outputSpent ({ txid, vout, topic }) {
    if (!this.topics.includes(topic)) return
    await this.storageEngine.deleteRecord({ txid, vout })
  }

  /**
   *
   * @param {object} obj all params given in an object
   * @param {object} obj.query lookup query given as an object
   * @returns {object} with the data given in an object
   */
  async lookup ({ query }) {
    // Validate Query
    if (!query) {
      const e = new Error('Lookup must include a valid query!')
      throw e
    }
    if (typeof query.txid !== 'undefined' &&
      typeof query.vout !== 'undefined') {
      return await this.storageEngine.findByTxidVout({
        txid: query.txid,
        vout: query.vout
      })
    } else if (query.findAll === 'true') {
      return await this.storageEngine.findAll()
    } else {
      const e = new Error('Query parameters must include either a txid + vout or "findAll = \'true\'".')
      throw e
    }
  }
}
