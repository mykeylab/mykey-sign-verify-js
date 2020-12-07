let Web3 = require('web3');
let web3 = new Web3(new Web3.providers.HttpProvider("https://eth.mykey.tech"));

// MYKEY账户数据存储合约地址
let AccountStorageAddr = '0xADc92d1fD878580579716d944eF3460E241604b7'
// MYKEY账户数据存储合约的abi, https://etherscan.io/address/0xADc92d1fD878580579716d944eF3460E241604b7#code
let AccountStorageABI = require('../eth/AccountStorage.abi.json').abi
// MYKEY账户数据存储合约实例
let AccountStorageIns = new web3.eth.Contract(AccountStorageABI, AccountStorageAddr);

// MYKEY主网测试账户， 0x3bB9E1783D5F60927eD6c3d0c32BfAD055A1b72f， 第3把操作密钥 0x37ac6c8229788643d62eF447eD988Ee7F00f8875
let UserAccountAddress = '0x3bB9E1783D5F60927eD6c3d0c32BfAD055A1b72f'
// 应用对接登录与签名时用到的是第3个操作密钥
let SigningKeyIndex = 3

// Equals to `bytes4(keccak256("isValidSignature(bytes,bytes)"))`
let magicValue = "0x20c13b0b"


// 链上查询签名公钥及状态
async function getSigningKeyAndStatus() {
    // 1. 获取用户账户的第3个操作密钥
    let signingKey = await AccountStorageIns.methods.getKeyData(UserAccountAddress, SigningKeyIndex).call();
    console.log(UserAccountAddress, "账户签名KEY:", signingKey)

    // 2. 获取用户账户的第3个操作密钥的状态， 正常是0， 冻结是1
    let signingKeyStatus = await AccountStorageIns.methods.getKeyStatus(UserAccountAddress, SigningKeyIndex).call();
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
    let unsignedData = '0x3136303639303436383230783362423945313738334435463630393237654436633364306333324266414430353541316237326665393436373131382d393332312d343931362d383135332d3461356139303837653531656d796b65794538374533434337383843343442423835343430303341463643454236324538'
    return unsignedData
}


// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1271.md
async function verifySignatureBy1271(unsignedData, signature, signingKey, accountAddr) {
    let unsignedDataHash = web3.utils.soliditySha3(unsignedData);
    console.log("unsignedDataHash ", unsignedDataHash)
    
    let abi = [{"constant":true,"inputs":[{"name":"","type":"bytes"},{"name":"","type":"bytes"}],"name":"isValidSignature","outputs":[{"name":"","type":"bytes4"}],"payable":false,"stateMutability":"view","type":"function"}];
    let account = await new web3.eth.Contract(abi, accountAddr);

    let res = await account.methods.isValidSignature(unsignedData,signature).call();

    console.log("returnedValue: ", res)
    console.log("验证签名:", res === magicValue)
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
    let signature = "0x53d86f27d725d3660f242cf0efc1f62aed8c805a39bf9783e2e7c1f65a81d94f775dbcb2e7268672dccbb68518bf5b9ba5f0ad5b2bf20ff4f8c9043f7c43d6651c"

    console.log("unsignedData", unsignedData)
    console.log("signature", signature)



    console.log("==============================验证签名==============================")
    await verifySignatureBy1271(unsignedData, signature, signingKeyObj.signingKey, UserAccountAddress);


}


main()