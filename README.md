# tcpip-visual-guide

Interactive visual guide to the TCP/IP model, TCP, and IPv4 addressing for beginner high-school students. Plain HTML, CSS and JavaScript: no build step, no frameworks, no CDNs.

Live site (after setup): https://mrroush.github.io/tcpip-visual-guide/

## Files
- `index.html`, `css/styles.css`, `js/app.js`: the page
- `js/subnet.js`: IPv4 subnet math, shared by the page and the tests
- `js/tests.html`: open in a browser to run subnet self-tests (/8, /16, /24, /30 and more)
- `.github/workflows/pages.yml`: deploys to GitHub Pages

## GitHub Pages setup
1. Push or merge to `main`.
2. In the repository go to **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. The workflow runs on each push to `main`; the site appears at https://mrroush.github.io/tcpip-visual-guide/

## Run locally
`python3 -m http.server` then open http://localhost:8000/. All paths are relative, so it also works under the `/tcpip-visual-guide/` subpath.

## Sources
RFC 791, RFC 9293, RFC 768, RFC 1918, RFC 4632.
