import { TokenTopicManager as Manager } from '../src/TokenTopicManager'
import pushdrop from 'pushdrop'
import bsv from 'babbage-bsv'
import { Transaction } from 'confederacy-base'

const randomKey = bsv.PrivateKey.fromRandom().toWIF()

describe('Tokens Topic Manager', () => {
  it('Admits issuance output', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: []
    })
  })
  it('Admits issuance output with metadata', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100',
              'metadata_1'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: []
    })
  })
  it('Redeems an issuance output', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
          id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_iss',
        vout: 0,
          rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_iss.0',
              '100'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1]
    })
  })
  it('Redeems an issuance output with metadata', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100',
              'metadata_1'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_iss',
        vout: 0,
          rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_iss.0',
              '100',
              'metadata_1'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1]
    })
  })
  it('Will not redeem issuance output if metadata changes', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100',
              'metadata_1'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_iss',
        vout: 0,
          rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_iss.0',
              '100',
              'metadata_changed'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [],
      outputsToRetain: []
    })
  })
   it('Does not redeem issuance output when amount is too large', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_iss',
        vout: 0,
          rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_iss.0',
              '101'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [],
      outputsToRetain: []
    })
   })
   it('Redeems a non-issuance output', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1]
    })
   })
  it('Redeems a non-issuance output with metadata', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100',
              'metadata_1'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100',
              'metadata_1'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1]
    })
  })
  it('Will not redeem non-issuance output when metadata changes', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100',
              'metadata_1'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100',
              'metadata_changed'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [],
      outputsToRetain: []
    })
   })
  it('Does not admit non-issuance outputs when amounts are too large', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '101'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [],
      outputsToRetain: []
    })
  })
  it('Splits an asset into two outputs', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '75'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '25'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0, 1],
      outputsToRetain: [1]
    })
  })
  it('Will not split for more than the original amount, only letting the first outputs through', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '75'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '35'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1]
    })
  })
  it('Merges two tokens of the same asset into one output', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss1',
        vout: 0,
        rawTx: '...'
      }, {
          id: 2,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss2',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid.0',
              '250'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0],
      outputsToRetain: [1, 2]
    })
  })
  it('Does not merge two different assets into one output', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid1.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss1',
        vout: 0,
        rawTx: '...'
      }, {
          id: 2,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid2.0',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_noiss2',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_assid1.0',
              '250'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [],
      outputsToRetain: []
    })
  })
  it('Splits one asset, merges a second, issues a third, and transfers a fourth, all in the same transaction', async () => {
    const manager = new Manager()
    const admitted = await manager.identifyAdmissibleOutputs({
      previousUTXOs: [{
        id: 1,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_split.0',
              '100'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in1',
        vout: 0,
        rawTx: '...'
      }, {
          id: 2,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_merge.0',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in2',
        vout: 0,
        rawTx: '...'
        }, {
          id: 3,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_merge.0',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in2',
        vout: 1,
        rawTx: '...'
        }, {
          id: 4,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_transfer.7',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in3',
        vout: 0,
        rawTx: '...'
        }, {
          id: 5,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_transfer.7',
              '150'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in4',
        vout: 0,
        rawTx: '...'
        }, {
          id: 6,
          outputScript: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_burnme.3',
              '1'
            ]
          }),
        satoshis: 1000,
        txid: 'mock_in4',
        vout: 0,
        rawTx: '...'
        }],
      parsedTransaction: new Transaction('', '', [], [{
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_split.0',
              '75'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_split.0',
              '25'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_merge.0',
              '300'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'ISSUE',
              '500'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_transfer.7',
              '250'
            ]
          }),
          satoshis: 1000
        }, {
          script: await pushdrop.create({
            key: randomKey,
            fields: [
              'mock_transfer.7',
              '50'
            ]
          }),
          satoshis: 1000
        }])
      })
    expect(admitted).toEqual({
      outputsToAdmit: [0, 1, 2, 3, 4, 5],
      outputsToRetain: [1, 2, 3, 4, 5]
    })
  })
})
