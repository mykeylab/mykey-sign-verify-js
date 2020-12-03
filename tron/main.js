let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider("https://eth.mykey.tech"));


const TronWeb = require('tronweb')

const tronWeb = new TronWeb({
    fullNode: 'https://api.trongrid.io',
    solidityNode: 'https://api.trongrid.io',
})

// MYKEY账户数据存储合约地址
let AccountStorageAddr = 'TPySxtwcTtkSTjqAKSBztMvvaqJhjNBH1k'


// MYKEY主网测试账户， TSE3pCxRmSr7bPqk2qvQVFp2tah7LkyqeF 第3把操作密钥 TF3aiq4vjg3pvU4kfMy588YzjPsahKi7Pd, hex 格式 4137ac6c8229788643d62ef447ed988ee7f00f8875
let UserAccountAddress = 'TSE3pCxRmSr7bPqk2qvQVFp2tah7LkyqeF'
// 应用对接登录与签名时用到的是第3个操作密钥
let SigningKeyIndex = 3


// 链上查询签名公钥及状态
async function getSigningKeyAndStatus() {
    let AccountStorageIns = await tronWeb.contract().at(AccountStorageAddr)

    // 1. 获取用户账户的第3个操作密钥
    let signingKey = await AccountStorageIns.methods.getKeyData(UserAccountAddress, SigningKeyIndex).call()
    signingKey = tronWeb.address.fromHex(signingKey)
    console.log(UserAccountAddress, "账户签名KEY:", signingKey)

    // 2. 获取用户账户的第3个操作密钥的状态， 正常是0， 冻结是1
    let signingKeyStatus = await AccountStorageIns.methods.getKeyStatus(UserAccountAddress, SigningKeyIndex).call();
    signingKeyStatus = signingKeyStatus.toString()
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
    let timestamp = "1606904917"
    let account = "TSE3pCxRmSr7bPqk2qvQVFp2tah7LkyqeF"
    let uuID = "e9467118-9321-4916-8153-4a5a9087e51e"
    let ref = "mykey"
    let mykeyUID = "E87E3CC788C44BB8544003AF6CEB62E8"

    let str = timestamp + account + uuID + ref + mykeyUID

    let unsignedData = '0x' + Buffer.from(str).toString('hex')
    return unsignedData
}

// 验证签名
async function verifySignature(unsignedData, signature, signingKey) {

    // 需要使用 web3.utils.soliditySha3
    let unsignedDataHash = web3.utils.soliditySha3(unsignedData);
    console.log("unsignedDataHash ", unsignedDataHash)

    // let unsignedDataHash2 = tronWeb.sha3(unsignedData)
    // console.log("unsignedDataHash2 ", unsignedDataHash2)

    ret = TronWeb.Trx.verifySignature(unsignedDataHash, signingKey, signature)
    console.log("验证签名:", ret)

}


async function main() {

    // set the owner address, https://github.com/tronprotocol/tronweb/issues/90
    tronWeb.setAddress(UserAccountAddress)

    console.log("==============================链上查询签名公钥及状态==============================")
    let signingKeyObj = await getSigningKeyAndStatus()

    if (signingKeyObj.signingKeyStatus === "1") {
        console.log("操作密钥状态不可用")
        return
    }

    console.log("==============================获取待签名数据==============================")
    // unsignedData 和 signature 数据来源于MYKEY主网测试账户， 参考SDK的"如何验签"章节。
    let unsignedData = await getUnsignedData()
    let signature = "0x3e6540f8782f4890fadc4f6b9eef1fb8d1717e275f8c3c5ade2f3dd4edd1d0ae7e605047698d20071f89418698b7cfa42a2b5506699c7ee43ad20ba827d8492a1c"

    console.log("unsignedData", unsignedData)
    console.log("signature", signature)


    console.log("==============================验证签名==============================")
    await verifySignature(unsignedData, signature, signingKeyObj.signingKey)

}

main()

