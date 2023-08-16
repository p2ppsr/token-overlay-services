import makeMigrations from './makeMigrations'

/**
 * StorageEngine specifically implemented for Tokens Lookup with Knex
 * TODO: Use Typescript interface to extend functionality of base class
 * Generic lookservice should return the topic as well as the txid and vout
 */
export class KnexStorageEngine {
  private knex
  private tablePrefix
  private migrations
  constructor ({ knex, tablePrefix = 'tokens_lookup_' }) {
    this.knex = knex
    this.tablePrefix = tablePrefix
    this.migrations = makeMigrations({ tablePrefix })
  }

  /**
   * Stores a new TSP record
   * @param {object} obj all params given in an object
   * @param {string} obj.txid the transactionId of the transaction this UTXO is apart of
   * @param {Number} obj.vout index of the output
   * @param {String} obj.protectedKey KVStore key
   */
  async storeRecord ({ 
    txid, 
    vout, 
    amount,
    ownerKey,
    assetId
  }) {
    await this.knex(`${this.tablePrefix}tokens`).insert({
      txid,
      vout,
      amount,
      ownerKey,
      assetId
    })
  }

  /**
   * Deletes an existing kvstore record
   * @param {Object} obj all params given in an object
   */
  async deleteRecord ({ txid, vout }) {
    await this.knex(`${this.tablePrefix}tokens`).where({
      txid,
      vout
    }).del()
  }

  /**
   * Look up a kvstore record by the protectedKey
   * @param {Object} obj params given in an object
   * @param {String} obj.txid UTXO's TXID
   * @param {Number} obj.vout UTXO's vout
   */
  async findByTxidVout ({ txid, vout }) {
    return await this.knex(`${this.tablePrefix}tokens`).where({
      txid,
      vout
    }).select('txid', 'vout')
  }

  async findAll () {
    return await this.knex(`${this.tablePrefix}tokens`).select('txid', 'vout')
  }
}