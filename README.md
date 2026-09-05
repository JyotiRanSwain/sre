# Sri Ram Energy Space System — Website

A modern, animated, colourful solar-energy business website built with plain HTML5, CSS3 and vanilla JavaScript, backed by Google Apps Script + Google Sheets/Drive.

## 1. What's included

```
/
├── index.html                Homepage (full-screen video hero)
├── Our Services/index.html
├── Our Clients/index.html
├── Our Projects/index.html   Dynamic projects (Google Apps Script)
├── Why Us/index.html
├── About Us/index.html
├── Contact/index.html        Contact form → Google Apps Script → email
├── admin/index.html          Admin login + dashboard (projects CRUD)
├── css/style.css
├── js/main.js
├── images/
│   ├── logo.png               ← placeholder generated logo, replace with the real one
│   └── solar-banner.mp4       ← not included, add your video here
├── apps-script/Code.gs         Backend source to paste into Apps Script
└── README.md
```

The site works and looks complete right now with **sample/placeholder data** for projects (clearly marked in the code) so you can review the design before connecting the backend.

## 2. Replace the logo, hero video, and page banner images

- Replace `images/logo.png` with your real rectangular logo (same filename, or update the `<img src>` references).
- Add your homepage video as `images/solar-banner.mp4`. The hero `<video>` tag already points to it.
- Every inner page now has a banner slot ready for an image — just drop a JPG/PNG into `images/` with these exact filenames and it appears automatically (a dark gradient overlay keeps the heading text readable over any photo):
  - `images/services-banner.jpg` — Our Services
  - `images/clients-banner.jpg` — Our Clients
  - `images/projects-banner.jpg` — Our Projects
  - `images/why-us-banner.jpg` — Why Us
  - `images/about-banner.jpg` — About Us
  - `images/contact-banner.jpg` — Contact
  If a file isn't there yet, the banner just shows the navy gradient — nothing breaks.

## 3. Deploy the frontend

This is a static site — upload the whole folder as-is to any static host (Netlify, Vercel, GitHub Pages, Hostinger, cPanel, etc.). No build step is required. Because pages live in folders with spaces in their names ("Our Services", etc.), most hosts handle this fine, but if your host doesn't like spaces in URLs you can rename the folders (e.g. `our-services`) and update the links in each HTML file and in `js/build_pages` accordingly.

## 4. Set up the Google Sheet (database)

1. Create a new Google Sheet.
2. Create three tabs with these exact headers in row 1:

   **Projects**
   `project_id | title | story | image_url | created_at | updated_at | status`

   **Admins**
   `admin_id | username | password_hash | name | status`

   **Messages**
   `message_id | name | phone | email | subject | message | created_at | status`

3. Copy the Sheet's ID from its URL (`https://docs.google.com/spreadsheets/d/THIS_PART/edit`).

### Add your first admin user

Passwords are stored as SHA-256 hashes, never in plain text. To create one:
1. In the Apps Script editor (see below), open the Script Editor's console and run:
   `Logger.log(hashPassword("your-chosen-password"))`
2. Copy the printed hash into the `Admins` sheet: `admin_id` (e.g. `ADM001`), `username`, the hash in `password_hash`, `name`, `status` = `active`.

## 5. Set up Google Drive (image storage)

1. Create a folder in Google Drive, e.g. "Sri Ram Energy Space System / Projects".
2. Copy its folder ID from the URL.

## 6. Configure and deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com) → New Project.
2. Paste the contents of `apps-script/Code.gs` into `Code.gs`.
3. At the top of the file, set:
   - `SHEET_ID` — your Google Sheet ID (step 4)
   - `DRIVE_FOLDER_ID` — your Drive folder ID (step 5)
   - `NOTIFY_EMAIL` — the inbox that should receive contact-form alerts
4. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the deployment URL (ends in `/exec`).

## 7. Connect the frontend to Apps Script

Open `js/main.js` and set:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

Save and re-upload. The Our Projects page, homepage featured projects, contact form and admin panel will now use live data instead of sample data.

## 8. Configure WhatsApp

WhatsApp links are generated from a single number in `js/main.js`:

```js
const COMPANY = {
  phone: "8917270469",
  whatsappPhone: "918917270469", // country code + number, no + or spaces
  email: "info@sriramrnergyspacesystem.com",
};
```

Update these if the business number changes.

## 9. Add / edit / delete projects

1. Go to `/admin/` and log in with the admin username/password you created in step 4.
2. **Add Project**: upload one image (JPG/PNG/WEBP, max 5MB), enter a title and story, click **Publish Project**.
3. **Projects** tab: edit or delete any project. Deleting asks for confirmation first.
4. New/updated projects appear automatically on the **Our Projects** page and homepage — no HTML editing required.

## 10. Change company information

Company name, address, phone, email, and GST number appear as plain text in each page's HTML (`Contact/index.html`, `About Us/index.html`, the footer in every page, and meta tags in `<head>`). Search and replace as needed. WhatsApp/call numbers additionally live in `js/main.js` (see step 8).

## 11. Security notes

- Admin credentials are never present in any HTML/CSS/JS file.
- Login is verified server-side in Apps Script; a session token (cached for 2 hours) is required for every add/edit/delete action.
- Passwords are stored as SHA-256 hashes in the `Admins` sheet, never in plain text.
- Logging out clears the token from the browser; the server-side cache entry also expires automatically.

## 12. Troubleshooting

- **"Projects are temporarily unavailable"** — check that `GOOGLE_SCRIPT_URL` is set and the Apps Script deployment is set to "Anyone" access.
- **Admin login fails** — confirm the username/password hash in the `Admins` sheet, and that `status` is `active`.
- **Images not uploading** — check the file is under 5MB and is JPG/PNG/WEBP, and that `DRIVE_FOLDER_ID` is correct.
- **Contact form not emailing** — check `NOTIFY_EMAIL` in `Code.gs` and that the Apps Script project has permission to send email (you'll be prompted to authorize on first run).
