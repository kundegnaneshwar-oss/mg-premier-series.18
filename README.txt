MG PREMIER SERIES — VS Code website with payment flow + host page

RUN
1. Extract the ZIP.
2. Open the MG_Premier_Series folder in VS Code.
3. Install Live Server.
4. Right-click index.html and choose Open with Live Server.
5. Host page path: host.html (open it with Live Server too).

HOST DEMO LOGIN
Email: mgpremierseries.18@gmail.com
Password: 43104310

DEMO FLOW
- Register from index.html, then the payment page opens.
- Select a payment screenshot and click Complete Registration.
- On the SAME browser and Live Server origin, open host.html and log in to see the record.
- Host can view the screenshot, approve/reject demo registrations, search, and export CSV.

IMPORTANT SECURITY / STORAGE LIMITATIONS
This is a browser-only prototype. The login credentials are visible in host.js and are NOT secure for a public deployment. Registration records and screenshots are saved only in the current browser's localStorage, so the host cannot see submissions from other people's devices. Do not treat an uploaded screenshot as payment verification. For a real public website, use server-side authentication, a backend/database, secure image storage, and manual payment verification.


HOST PUBLIC PAGE SETTINGS
- Sign in at host.html using the demo host login.
- In “Registration & Tournament Details”, switch Open team registrations ON/OFF.
- OFF shows “REGISTRATIONS OPENING SOON — Stay tuned” instead of the form.
- Set the session number/title, tournament address, and Google Maps link, then save.
- The public index.html reads these settings from localStorage in the same browser/origin. This demo does NOT sync settings to other people's devices. A real deployed site needs a backend/database for the host's changes to be public to all visitors.
