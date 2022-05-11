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
  jsx,
} from "../index.js";

scriptedGlobals({
  h: jsx,
  useState: (value) => {
    const effects = [];
    const multiple =
      (...arr) =>
      (...args) =>
        arr.map((fn) => fn(...args));
    const set = multiple(
      (t, p, v) => !!Object.assign(t, { [p]: v }),
      (t) => !!effects.map((fn) => fn(t.value))
    );
    const state = new Proxy({ value }, { set });
    return [(v) => effects.push(v), (fn) => (state.value = fn(state.value))];
  },
});

const Layout = ({ children }) => (
  <html>
    <style dangerouslySetInnerHTML={{ __html: styledGet() }}></style>
    <script type="module" dangerouslySetInnerHTML={{ __html: scriptedGet() }} />
    <body>{children}</body>
  </html>
);

const Todo = () => (
  <Layout>
    <form
      className={classs(
        className,
        scripted((node) => {
          const [todosListener, setTodos] = useState([]);
          todosListener((todos) =>
            (todos.length === 0
              ? node.querySelector("ul")?.remove()
              : node.querySelector("ul") ?? node.appendChild(<ul></ul>)
            )?.replaceChildren(
              ...todos.map(({ active, value }, i) => (
                <li className={active}>
                  <span>{value}</span>
                  <button
                    type="button"
                    name="close"
                    onclick={() =>
                      setTodos((arr) => arr.filter((_, v) => v !== i))
                    }
                  >
                    Remove
                  </button>
                </li>
              ))
            )
          );
          node.addEventListener("submit", (e) => {
            e.preventDefault();
            setTodos((arr) => [
              ...arr,
              { value: new FormData(e.target).get("value"), active: true },
            ]);
          });
        })
      )}
    >
      <input name="value" />
      <button>Add</button>
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
    apply(<Todo />, (elt) => (renderToString(elt), renderToString(elt)))
);
