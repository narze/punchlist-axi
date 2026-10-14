// The component gallery: every picker component in its main states, on a plain page (no shadow root),
// so punchlist itself can annotate them. Not shipped.
import { mount } from 'svelte';
import shared from '../src/client/shared.css';
import Gallery from './Gallery.svelte';

const style = document.createElement('style');
style.textContent = shared;
document.head.append(style);
const app = document.getElementById('app');
if (app) mount(Gallery, { target: app });

// esbuild's dev server announces each rebuild on /esbuild
if (typeof EventSource !== 'undefined') new EventSource('/esbuild').addEventListener('change', () => { location.reload(); });
