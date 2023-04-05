import QrScanner from './qr-scanner.min.js';

const owner = "Catalufa";
const repo = "OneTravel";

async function upload(filePath, fileContent, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    }
  });

  let sha = "";
  if (response.ok) {
    const data = await response.json();
    sha = data.sha;
  }

  const content = btoa(fileContent);
  const body = JSON.stringify({
    message: "Update file",
    content: content,
    if(sha){sha}
  });

  const updateResponse = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json"
    },
    body: body
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to upload/update file ${filePath}: ${updateResponse.statusText}`);
  }
}

// document.querySelector("#auth-btn").addEventListener("click", function(){
//   upload(prompt("Path"),prompt("Content"),prompt("Token"))
// })

document.querySelector("#admin").addEventListener("click", function() {
  getTableData();

  var qrOn = false;
  const container = document.querySelector(".admin-qr-container")
  const play = container.querySelector("i")
  const video = container.querySelector("video")
  const data = document.querySelector("#admin-qr-text")

  const qrScanner = new QrScanner(
    video,
    result => {
      data.value = result.data;
      container.click();
    },
    {
      returnDetailedScanResult: true
    }
  );

  container.addEventListener("click", function() {
    if (qrOn) {
      qrScanner.stop();
      video.style.opacity = "0";
      play.style.display = "block";
      qrOn = false;
    } else {
      qrScanner.start();
      video.style.opacity = "1";
      play.style.display = "none";
      qrOn = true;
    }
  })

})

async function getTableData() {
  const m = await fetch("master")
    .then(response => response.text())
  const masterData = JSON.parse(aesDecrypt(m, licenseKey, id));
  for (x of masterData) {
    const user = fetch("users/" + x[0])
      .then(response => response.text())
    const u = aesDecrypt(user, x[1], x[0])
    addRow([u.username, u.plan, u.ticket[2]])
  }
}

function addRow(data, buttonMsg = "Go") {
  const table = document.querySelector(".admin-table");
  var newItem = document.createElement("tr");
  newItem.innerHTML = `
            <td>
              <div>${data[0]}</div>
            </td>
            <td>
              <div>${data[1]}</div>
            </td>
            <td>
              <div>${data[2]}</div>
            </td>
            <td>
              <div>${data[3]}</div>
            </td>
            <td><button>${buttonMsg}</button></td>`
  table.appendChild(newItem)
}

document.querySelector("#admin-new-user").addEventListener("click", function() {
  addUser(prompt("username"),prompt("plan"),token)
})

async function addUser(username,plan,token) {
  const newData = {username, plan, ticket:[]}
  const enc = aesEncrypt(newData.toString())
  upload("users/"+enc.iv, enc.data, token)
  const master = await fetch("master")
    .then(response => response.text())
  var newMaster = JSON.parse(aesDecrypt(master, licenseKey, id))
  newMaster.push([enc.iv, enc.key])
  upload("master", aesEncrypt(newMaster.toString(), licenseKey, id), token)
}