import QrScanner from './qr-scanner.min.js';
import { Octokit } from "https://cdn.skypack.dev/octokit";

const octokit = new Octokit({
  auth: localStorage.getItem("token"),
});

const owner = "Catalufa";
const repo = "OneTravel";

async function upload(filePath, fileContents) {
  try {
    // Use the Octokit API to get the SHA of the file, if it exists
    const { data } = await octokit.rest.repos.getContent({
      owner: owner,
      repo: repo,
      path: filePath,
    });
    // If the file exists, update its contents
    const fileSha = data.sha;
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: owner,
      repo: repo,
      path: filePath,
      message: "Update file",
      content: btoa(fileContents),
      sha: fileSha,
    });
  } catch (error) {
    // If the file does not exist, create it
    await octokit.rest.repos.createOrUpdateFileContents({
      owner: owner,
      repo: repo,
      path: filePath,
      message: "Create file",
      content: btoa(fileContents),
    });
  }
}

async function get(filePath) {
  const { data } = await octokit.rest.repos.getContent({
    owner: owner,
    repo: repo,
    path: filePath
  });

  const content = data.content;
  const decodedContent = atob(content);
  return decodedContent;
}

async function remove(filePath) {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path: filePath });

  // If the file exists, delete it
  const fileSha = data.sha;
  await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path: filePath,
    message: 'Delete file',
    sha: fileSha,
  });
}

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


const table = document.querySelector(".admin-table");

async function getTableData() {
  while (table.rows.length > 1) {
    table.deleteRow(1);
  }
  const m = await get("master")
  const masterData = JSON.parse(aesDecrypt(m, licenseKey, id));
  for (let x of masterData) {
    const user = await get("users/" + x[0])
    const u = JSON.parse(aesDecrypt(user, x[1], x[0]))
    addRow([`<a href="${window.location.href.split("?")[0]}?license=${encodeURIComponent(x[1])}&id=${encodeURIComponent(x[0])}">${u.username}</a>`, u.plan, u.ticket.name, u.ticket.expiry, x[0], x[1], u])
  }
}

document.querySelector("#admin").addEventListener("click", function() {
  getTableData();
});

document.querySelector("#admin-refresh-table").addEventListener("click", function() {
  getTableData();
});

function addRow(data) {
  var newItem = document.createElement("tr");
  newItem.setAttribute("id", data[4])

  var edit = document.createElement("button");
  edit.innerHTML = "Edit";
  edit.addEventListener("click", editUser, false)

  var update = document.createElement("button");
  update.innerHTML = "Update";
  update.addEventListener("click", (evt) => {
    const rowData = evt.currentTarget.parentElement.parentElement.querySelectorAll("input");
    updateUser(data[4], data[5], data[6], { username: rowData[0].value, plan: rowData[1].value })
  })

  var remove = document.createElement("button");
  remove.innerHTML = "Remove";
  remove.addEventListener("click", function() {
    removeUser(data[4])
  })

  var distribute = document.createElement("button");
  distribute.innerHTML = "Distribute";
  distribute.addEventListener("click", (evt) => {
    updateUser(data[4], data[5], data[6],
      {
        ticket: {
          name: document.querySelector("#admin-ticket-name").value,
          validity: document.querySelector("#admin-ticket-validity").value,
          expiry: document.querySelector("#admin-ticket-expiry").value,
          qrdata: document.querySelector("#admin-qr-text").value
        }
      }
    )
  })

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
            <td></td>`
  table.appendChild(newItem)
  table.lastChild.lastChild.appendChild(edit)
  table.lastChild.lastChild.appendChild(update)
  table.lastChild.lastChild.appendChild(remove)
  table.lastChild.lastChild.appendChild(distribute)
}

function editUser(evt) {
  const active = evt.currentTarget.parentElement.parentElement;
  var newName = document.createElement("input");
  newName.value = active.children[0].children[0].innerText
  active.children[0].children[0].remove()
  active.children[0].appendChild(newName)
  var newType = document.createElement("input");
  newType.value = active.children[1].children[0].innerText
  active.children[1].children[0].remove()
  active.children[1].appendChild(newType)
}

async function updateUser(updateId, updateLicense, updateData, changes) {
  const keys = Object.keys(updateData);
  for (let key of keys) {
    if (changes.hasOwnProperty(key)) {
      updateData[key] = changes[key]
    }
  }
  await upload("users/" + updateId, aesEncrypt(JSON.stringify(updateData), updateLicense, updateId).data)
  getTableData();
}

document.querySelector("#admin-new-user").addEventListener("click", function() {
  addUser(prompt("username"), prompt("plan"))
})

const updateToken = document.querySelector("#admin-token");
const token = localStorage.getItem("token");
updateToken.value = token;
document.querySelector("#admin-token-update").addEventListener("click", function() {
  localStorage.setItem("token", updateToken.value);
  window.location.reload();
})

async function addUser(username, plan) {
  const newData = { username, plan, ticket: { name: null, validity: null, expiry: null, qrdata: null } }
  const enc = aesEncrypt(JSON.stringify(newData))
  await upload("users/" + enc.iv, enc.data)
  const master = await get("master")
  var newMaster = JSON.parse(aesDecrypt(master, licenseKey, id))
  newMaster.push([enc.iv, enc.key])
  await upload("master", aesEncrypt(JSON.stringify(newMaster), licenseKey, id).data)
  getTableData()
}

async function removeUser(removeId) {
  const master = await get("master");
  var newMaster = JSON.parse(aesDecrypt(master, licenseKey, id));
  for (let x of newMaster) {
    if (x[0] == removeId) {
      newMaster.splice(newMaster.indexOf(x), 1);
    }
  }
  await upload("master", aesEncrypt(JSON.stringify(newMaster), licenseKey, id).data)
  await remove("users/" + removeId)
  getTableData()
}