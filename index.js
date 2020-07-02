// AsyncMethodを集めた関数。つまりAPI処理がメイン。
import { API, graphqlOperation } from 'aws-amplify'

// アクセスグループをフラグが入ってるか否かで求める。グループはリストで返ってくる仕様で、いっぱい入るとバグる可能性あるから、安全の為。
export const accessGroupIsin = (user, label) => {
  if (!user) return false
  const groups = user.signInUserSession.accessToken.payload['cognito:groups']
  if (!groups) return false
  const result = user.signInUserSession.accessToken.payload['cognito:groups'].indexOf(label)
  if (result < 0) {
    return false
  } else {
    return true
  }
}

// Amplifyで得た結果をパースする（AWSJSONを普通のobjectに変換してる）
export const parseAWSJSONFromForm = (param, forms) => {
  for (const form of forms) {
    if (form.type === 'AWSJSON') {
      param[form.name] = JSON.parse(param[form.name])
    }
  }
  return param
}

// Amplifyで得た結果をパースする（AWSJSONを普通のobjectに変換してる）
// StringをJSONに変換する。AmplifyはJSON保存形式はStringで扱う性質がある為、変換しないと取得出来ない。
export const decodeAWSJSONFromForm = (param, forms) => {
  const resultParam = {}
  for (const form of forms) {
    if (form.type === 'AWSJSON') {
      resultParam[form.name] = JSON.parse(param[form.name])
    } else {
      resultParam[form.name] = param[form.name]
    }
  }
  return resultParam
}

// JSONをStringに変換する
export const encodeAWSJSONFromForm = (param, forms) => {
  const resultParam = {}
  for (const form of forms) {
    if (form.type === 'AWSJSON') {
      resultParam[form.name] = JSON.stringify(param[form.name])
    } else {
      resultParam[form.name] = param[form.name]
    }
    if (form.type === 'Address') {
      resultParam[form.option.lat] = param[form.option.lat]
      resultParam[form.option.lng] = param[form.option.lng]
    }
  }
  return resultParam
}


// オブジェクトのキーをstringで記述する。listviewmanagerとかで使ってる。
export const objectKeyFromString = (o, s) => {
  s = s.split('.')
  for (const sOne of s) {
    o = o[sOne]
  }
  return o
}


// 電話番号を国際番号に変更する（今の所は日本語のみ対応）
export const toGlobalPhoneNumber = (phoneNumber) => {
  phoneNumber = phoneNumber.slice(1)
  return '+81' + phoneNumber
}


// ランダム文字を生成する
export const randomString = (length) => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}


// 現在のタイムスタンプ時間を返す
export const currentTimestamp = () => {
  return Math.floor(Date.now() / 1000)
}


// Image名を生成する
export const createImageName = () => {
  return currentTimestamp() + '_' + randomString(30)
}


// AppSyncから得たデータを抽出する
export const graphqlDataToResult = (data) => {
  return data.data[Object.keys(data.data)[0]]
}


// アカウントのアクセストークンを取得する。
export const getAccessToken = (user) => {
  for (const storage of Object.keys(user.storage)) {
    if (storage.includes('accessToken')) {
      return user.storage[storage]
    }
  }
  return null
}


// ショップの画像を取得してファイル名を返す
export const createShopImageAndReturnImageName = async (imageData) => {
  const filePath = createImageName()
  const fileExt = imageData.split(';')[0].split('/')[1]
  const user = await getCurrentUserData()
  const accessToken = getAccessToken(user)
  await imageSubmit(accessToken, imageData, filePath)
  return filePath + '.' + fileExt
}


// 指定したIDでアイテムを取得する
export const graphqlGet = async (ql, id) => {
  try {
    const r = await API.graphql(graphqlOperation(ql, { id: id }))
    return r.data[Object.keys(r.data)[0]]
  } catch (err) {
    console.log('ERROR', err)
  }
}


// 全てのデータを取得する
export const getGraphQlFullList = async (graphql, query = {}, objectKey = '') => {
  let nextToken = null
  const posts = []
  try {
    while (true) {
      query.nextToken = nextToken
      const post = await API.graphql(graphqlOperation(graphql, query))
      let params
      if (objectKey !== '') {
        params = objectKeyFromString(post, objectKey)
      } else {
        params = post.data[Object.keys(post.data)[0]]
      }
      posts.push(...params.items)
      nextToken = params.nextToken
      if (nextToken === null) {
        return posts
      }
    }
  } catch (e) {
    console.log(e)
  }
  return posts
}


// errorパターンの処理も含めたタイプ
export const graphqlQuery = async (ql, query) => {
  try {
    const r = await API.graphql(graphqlOperation(ql, query))
    return r
  } catch (err) {
    console.log('ERROR', err)
    return null
  }
}