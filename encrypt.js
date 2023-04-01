function generateKey(length) {
  wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$';
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => wishlist[x % wishlist.length])
    .join('')
}


function aesEncrypt(data, key = generateKey(32), iv = generateKey(16)) {
  console.log(encodeURIComponent(key))
  console.log(encodeURIComponent(iv))
  let cipher = CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return cipher.toString();
}

function aesDecrypt(data, key, iv) {
  let cipher = CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(key), {
    iv: CryptoJS.enc.Utf8.parse(iv),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return cipher.toString(CryptoJS.enc.Utf8);
}