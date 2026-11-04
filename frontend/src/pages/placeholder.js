import { icon } from "../components/icons.js";
import { roles } from "../navigation.js";

export function placeholder(role, page) {
  const [title, , iconName] = roles[role].links.find((item) => item[1] === page) || roles[role].links[0];
  return `
    <section class="placeholder-panel">
      <span class="placeholder-icon">${icon(iconName)}</span>
      <span class="eyebrow muted-eyebrow">${roles[role].label.toUpperCase()} WORKSPACE</span>
      <h1>${title}</h1>
      <p>This page is ready for your ${title.toLowerCase()} experience. The current build provides the layout and navigation only.</p>
      <span class="coming-soon"><span></span> PAGE PLACEHOLDER</span>
    </section>`;
}
