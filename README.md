# Shalimar

SSR toolkit for modern bare-minimum Javascript

```jsx
import { createElement as h } from "react";
import { mkdir, writeFile } from "fs/promises";
import { renderToString } from "react-dom/server";
import {
  classs,
  scripted,
  scriptedGet,
  scriptedGlobals,
  styled,
  styledGet,
} from "shalimar";

const Layout = ({ children }) => (
  <html>
    <style dangerouslySetInnerHTML={{ __html: styledGet() }}></style>
    <script type="module" dangerouslySetInnerHTML={{ __html: scriptedGet() }} />
    <body>{children}</body>
  </html>
);

const HelloWorld = () => (
  <Layout>
    <form
      className={classs(
        className,
        scripted((node) => {
          node.addEventListener("submit", (e) => {
            e.preventDefault();
            node.querySelector("div").textContent = new FormData(e.target).get("value");
          });
        })
      )}
    >
      <div></div>
      <input name="value" />
      <button>Write</button>
    </form>
  </Layout>
);

const className = styled("Todo")`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 2rem;
  border: 1px solid #000;
`;

const apply = (v, fn) => fn(v);
await mkdir("dist").catch(() => null);
await writeFile(
  "dist/index.html",
  "<!DOCTYPE html>" +
    apply(<HelloWorld />, (elt) => (renderToString(elt), renderToString(elt)))
);
```
