/**
 * SRI RAM ENERGY SPACE SYSTEM — Google Apps Script Backend
 * ----------------------------------------------------------
 * Deploy this as a Web App (Execute as: Me, Access: Anyone).
 * Paste the deployment URL into GOOGLE_SCRIPT_URL in js/main.js.
 *
 * Sheets required (create a Google Sheet and note its ID below):
 *   Projects: project_id | title | story | image_url | created_at | updated_at | status
 *   Admins:   admin_id | username | password_hash | name | status
 *   Messages: message_id | name | phone | email | subject | message | created_at | status
 *
 * Drive folder required for project images (note its ID below).
 */

const SHEET_ID = "PASTE_YOUR_GOOGLE_SHEET_ID_HERE";
const DRIVE_FOLDER_ID = "PASTE_YOUR_DRIVE_FOLDER_ID_HERE";
const NOTIFY_EMAIL = "info@sriramrnergyspacesystem.com";
const TOKEN_TTL_MINUTES = 120;

function doGet(e) {
  const action = e.parameter.action;
  try {
    if (action === "getProjects") return json(getProjects());
    return json({ success: false, message: "Unknown action" });
  } catch (err) {
    return json({ success: false, message: "Something went wrong" });
  }
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { /* ignore */ }
  const action = body.action;
  try {
    switch (action) {
      case "login": return json(login(body.username, body.password));
      case "addProject": return json(requireAuth(body, () => addProject(body)));
      case "updateProject": return json(requireAuth(body, () => updateProject(body)));
      case "deleteProject": return json(requireAuth(body, () => deleteProject(body)));
      case "sendMessage": return json(sendMessage(body));
      default: return json({ success: false, message: "Unknown action" });
    }
  } catch (err) {
    return json({ success: false, message: "Something went wrong" });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet(name) { return SpreadsheetApp.openById(SHEET_ID).getSheetByName(name); }

/* ---------------------- Projects ---------------------- */
function getProjects() {
  const sh = sheet("Projects");
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift();
  const data = rows
    .filter(r => r[0])
    .map(r => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = r[i]);
      return obj;
    })
    .filter(p => p.status !== "deleted");
  return { success: true, data: data };
}

function addProject(body) {
  if (!body.title || !body.story) return { success: false, message: "Title and story are required" };
  const sh = sheet("Projects");
  const id = "PRJ" + new Date().getTime();
  const now = new Date().toISOString();
  let imageUrl = "";
  if (body.image) imageUrl = saveImageToDrive(body.image, id);
  sh.appendRow([id, body.title, body.story, imageUrl, now, now, "active"]);
  return { success: true, message: "Project added successfully", data: { project_id: id } };
}

function updateProject(body) {
  if (!body.project_id) return { success: false, message: "project_id required" };
  const sh = sheet("Projects");
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("project_id");
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(body.project_id)) {
      const rowIndex = i + 1;
      if (body.title) sh.getRange(rowIndex, headers.indexOf("title") + 1).setValue(body.title);
      if (body.story) sh.getRange(rowIndex, headers.indexOf("story") + 1).setValue(body.story);
      if (body.image) {
        const url = saveImageToDrive(body.image, body.project_id);
        sh.getRange(rowIndex, headers.indexOf("image_url") + 1).setValue(url);
      }
      sh.getRange(rowIndex, headers.indexOf("updated_at") + 1).setValue(new Date().toISOString());
      return { success: true, message: "Project updated successfully" };
    }
  }
  return { success: false, message: "Project not found" };
}

function deleteProject(body) {
  const sh = sheet("Projects");
  const rows = sh.getDataRange().getValues();
  const headers = rows[0];
  const idCol = headers.indexOf("project_id");
  const statusCol = headers.indexOf("status");
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idCol]) === String(body.project_id)) {
      sh.getRange(i + 1, statusCol + 1).setValue("deleted");
      return { success: true, message: "Project deleted successfully" };
    }
  }
  return { success: false, message: "Project not found" };
}

function saveImageToDrive(base64DataUrl, projectId) {
  const match = base64DataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid image data");
  const contentType = match[1];
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, contentType, projectId + "." + contentType.split("/")[1]);
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return "https://drive.google.com/uc?export=view&id=" + file.getId();
}

/* ---------------------- Admin auth ---------------------- */
function login(username, password) {
  if (!username || !password) return { success: false, message: "Username and password are required" };
  const sh = sheet("Admins");
  const rows = sh.getDataRange().getValues();
  const headers = rows.shift();
  const uCol = headers.indexOf("username");
  const pCol = headers.indexOf("password_hash");
  const nCol = headers.indexOf("name");
  const sCol = headers.indexOf("status");
  const hash = hashPassword(password);
  for (const r of rows) {
    if (r[uCol] === username && r[sCol] !== "inactive") {
      if (r[pCol] === hash) {
        const token = issueToken(username);
        return { success: true, message: "Login successful", data: { token: token, name: r[nCol] || username } };
      }
      return { success: false, message: "Invalid username or password" };
    }
  }
  return { success: false, message: "Invalid username or password" };
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function issueToken(username) {
  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  cache.put("token_" + token, username, TOKEN_TTL_MINUTES * 60);
  return token;
}

function verifyToken(token) {
  if (!token) return null;
  return CacheService.getScriptCache().get("token_" + token);
}

function requireAuth(body, fn) {
  const username = verifyToken(body.token);
  if (!username) return { success: false, message: "Session expired. Please log in again." };
  return fn();
}

/* ---------------------- Contact messages ---------------------- */
function sendMessage(body) {
  if (!body.name || !body.phone || !body.message) return { success: false, message: "Name, phone and message are required" };
  const sh = sheet("Messages");
  const id = "MSG" + new Date().getTime();
  const now = new Date().toISOString();
  sh.appendRow([id, body.name, body.phone, body.email || "", body.subject || "", body.message, now, "new"]);

  const emailBody =
    "New Website Enquiry\n\n" +
    "Name: " + body.name + "\n" +
    "Phone: " + body.phone + "\n" +
    "Email: " + (body.email || "-") + "\n" +
    "Subject: " + (body.subject || "-") + "\n" +
    "Message: " + body.message + "\n" +
    "Date: " + now;

  try {
    MailApp.sendEmail(NOTIFY_EMAIL, "New Website Enquiry — Sri Ram Energy Space System", emailBody);
  } catch (err) { /* email failure should not block the saved message */ }

  return { success: true, message: "Thank you for contacting Sri Ram Energy Space System. Our team will get back to you soon." };
}
