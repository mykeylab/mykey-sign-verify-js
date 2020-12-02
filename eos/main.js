
const { JsonRpc } = require('eosjs');
const fetch = require('node-fetch');

const ecc = require('eosjs-ecc')

// MYKEY账户数据存储合约地址
let MYKEYMgrContract = 'mykeymanager'
const rpcEndpoint = 'https://eos.mykey.tech';

const rpc = new JsonRpc(rpcEndpoint, { fetch });


// MYKEY主网测试账户， mykeydoctest, 第3把操作密钥 EOS6XmD7NK12LnmtXHtdnReTYbgRV1JPeo1M1BQvrHgnz6J1nNCFZ
let UserAccountAddress = 'mykeydoctest'
// 应用对接登录与签名时用到的是第3个操作密钥
let SigningKeyIndex = 3


// 链上查询签名公钥及状态
async function getSigningKeyAndStatus() {
    // 1. 获取用户账户的第3个操作密钥
    result = await rpc.get_table_rows({ json: true, code: MYKEYMgrContract, scope: UserAccountAddress, table: 'keydata', limit: 10 })

    signingKeyObj = result.rows[SigningKeyIndex]
    signingKey = signingKeyObj.key.pubkey

    console.log(UserAccountAddress, "账户签名KEY:", signingKey)

    // 2. 获取用户账户的第3个操作密钥的状态， 正常是0， 冻结是1
    signingKeyStatus = signingKeyObj.key.status
    console.log(UserAccountAddress, "账户签名KEY状态:", signingKeyStatus)

    return {
        "signingKey": signingKey,
        "signingKeyStatus": signingKeyStatus
    }

}

// 获取待签名数据
async function getUnsignedData() {
    // 1. H5接入方式， 待签名数据是应用方自定义。
    // unsignedData = '...'

    // 2. SDK接入方式， 待签名数据需要先组装，不同链的构造格式有差别。参考SDK的"如何验签"章节。 
    let timestamp = "1606900362"
    let account = "mykeydoctest"
    let uuID = "e9467118-9321-4916-8153-4a5a9087e51e"
    let ref = "mykey"
    let mykeyUID = "E87E3CC788C44BB8544003AF6CEB62E8"

    let unsignedData = timestamp + account + uuID + ref + mykeyUID

    return unsignedData
}

// 验证签名
async function verifySignature(unsignedData, signature, signingKey) {

    let recoveredKey = ecc.recover(signature, unsignedData)
    console.log("recoveredKey: ", recoveredKey)

    console.log("recoveredKey: ", recoveredKey)
    console.log("验证签名:", recoveredKey === signingKey)
}

async function main() {

    console.log("==============================链上查询签名公钥及状态==============================")
    let signingKeyObj = await getSigningKeyAndStatus()

    if (signingKeyObj.signingKeyStatus === "1") {
        console.log("操作密钥状态不可用")
        return
    }

    console.log("==============================获取待签名数据==============================")
    // unsignedData 和 signature 数据来源于MYKEY主网测试账户， 参考SDK的"如何验签"章节。
    let unsignedData = await getUnsignedData()
    let signature = "SIG_K1_KcMxF6rNee2jsM9fge5CZWiENU4j6YLsHgKHD7n9TWvvhLSBtHE8rHV641sVdrw3JRcvCjBtGPRBHSBxzMubzw8DYVnk2e"

    console.log("unsignedData", unsignedData)


    console.log("==============================验证签名==============================")
    await verifySignature(unsignedData, signature, signingKeyObj.signingKey)
}


main()