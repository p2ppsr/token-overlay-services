export default ({ tablePrefix }) => ([{
    up: async knex => {
      await knex.schema.createTable(`${tablePrefix}tokens`, table => {
        table.increments('keyID')
        table.string('txid')
        table.integer('vout')
        table.integer('amount')
        table.string('assetId')
        table.string('ownerKey')
      })
    },
    down: async knex => {
      await knex.schema.dropTable(`${tablePrefix}tokens`)
    }
  }])
