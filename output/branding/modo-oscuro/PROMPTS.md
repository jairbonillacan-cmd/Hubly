# Hubly · Modo oscuro

Entregables finales: `hubly-isologo-dark`, `hubly-isotipo-dark` y `hubly-logotipo-dark`, cada uno en SVG y PNG transparente. Vista de conjunto: `vista-previa.png`, sobre tinta `#111C27`.

Paleta: cara y oreja izquierda `#DCEFF9`; oreja derecha `#7CC8EE`; ojos y boca `#16324F`; texto `#FFFFFF`.

Los borradores se editaron con ImageGen integrado. Sus exportaciones dejaron residuos de transparencia, por lo que no se usan como finales. La entrega final se reconstruyó como SVG a partir de las siluetas aprobadas del isotipo y logotipo claros, sin sustituir las letras por otra fuente. Los PNG se renderizan desde esos SVG. Exportación reproducible: `node output/branding/export-hubly-dark.cjs` desde la raíz del proyecto. No se ha cambiado el tema de la app.

## Prompts de ImageGen

### isologo

Referencia: `hubly-carita-hubi.png`

Use case: precise-object-edit. Create the DARK MODE version of the supplied approved Hubly brand asset. Preserve EXACT existing geometry, silhouette, proportions, custom rounded letterforms, optical spacing and kerning wherever present. Change COLORS ONLY and isolate the requested asset. Dark mode palette: the cat FACE AND LEFT EAR must become pale sky blue #DCEFF9; the RIGHT EAR stays brand sky blue #7CC8EE; the two oval eyes and tiny w mouth must become solid navy #16324F. Every letter of 'hubly' must become pure WHITE #FFFFFF. These reversed colors must be clearly visible on dark backgrounds #111C27 and #2B2B36, but DO NOT draw those backgrounds into the asset. Background must be genuinely TRANSPARENT alpha, including all letter counters and gaps. Flat uniform SOLID color, perfect clean smooth antialiased edges. NO gradient, shadows, halo, glow, outline, lighting, texture, paper, mockup, labels, palette swatches, frame or new decorations. Do not redesign the typography or cat. Asset requested: ONE horizontal combined logo, cat FACE ONLY to the LEFT and exact lowercase 'hubly' to the RIGHT. Keep the exact composition of the reference, balance and relative sizing; no body or tail. One combined logo only, centered on a wide horizontal transparent canvas with modest safe margins.

### isotipo

Referencia: `hubly-isotipo.png`

Use case: precise-object-edit. Create the DARK MODE version of the supplied approved Hubly brand asset. Preserve EXACT existing geometry, silhouette, proportions, custom rounded letterforms, optical spacing and kerning wherever present. Change COLORS ONLY and isolate the requested asset. Dark mode palette: the cat FACE AND LEFT EAR must become pale sky blue #DCEFF9; the RIGHT EAR stays brand sky blue #7CC8EE; the two oval eyes and tiny w mouth must become solid navy #16324F. Every letter of 'hubly' must become pure WHITE #FFFFFF. These reversed colors must be clearly visible on dark backgrounds #111C27 and #2B2B36, but DO NOT draw those backgrounds into the asset. Background must be genuinely TRANSPARENT alpha, including all letter counters and gaps. Flat uniform SOLID color, perfect clean smooth antialiased edges. NO gradient, shadows, halo, glow, outline, lighting, texture, paper, mockup, labels, palette swatches, frame or new decorations. Do not redesign the typography or cat. Asset requested: ONLY the standalone CAT FACE icon shown in the reference. Absolutely NO letters, wordmark or text of any kind; no body, legs or tail. Preserve the exact face proportions and eye/mouth placement. Center the single face on a square transparent canvas with modest even safe margins.

### logotipo

Referencia: `hubly-logotipo.png`

Use case: precise-object-edit. Create the DARK MODE version of the supplied approved Hubly brand asset. Preserve EXACT existing geometry, silhouette, proportions, custom rounded letterforms, optical spacing and kerning wherever present. Change COLORS ONLY and isolate the requested asset. Dark mode palette: the cat FACE AND LEFT EAR must become pale sky blue #DCEFF9; the RIGHT EAR stays brand sky blue #7CC8EE; the two oval eyes and tiny w mouth must become solid navy #16324F. Every letter of 'hubly' must become pure WHITE #FFFFFF. These reversed colors must be clearly visible on dark backgrounds #111C27 and #2B2B36, but DO NOT draw those backgrounds into the asset. Background must be genuinely TRANSPARENT alpha, including all letter counters and gaps. Flat uniform SOLID color, perfect clean smooth antialiased edges. NO gradient, shadows, halo, glow, outline, lighting, texture, paper, mockup, labels, palette swatches, frame or new decorations. Do not redesign the typography or cat. Asset requested: ONLY the exact standalone lowercase WORDMARK 'hubly' shown in the reference, all five letters h-u-b-l-y. Absolutely NO cat, icon, face, symbol or other graphic. Keep the exact existing custom letterforms, weights, counters, kerning and y descender. All letters pure WHITE #FFFFFF, uniform fill. One single word centered on a wide horizontal transparent canvas with modest safe margins.

### Segundo intento de isologo

Use case: compositing. Image 1 is the EXACT transparent cat face isotype. Image 2 is the EXACT transparent lowercase 'hubly' wordmark. Assemble these TWO EXACT assets into ONE horizontal dark-mode combined Hubly logo: cat face left, wordmark right with balanced spacing. Preserve their shapes and clean silhouettes exactly. Recolor cat's navy head and left ear to pale blue #DCEFF9, retain sky-blue #7CC8EE right ear, recolor eye ovals and w mouth to dark navy #16324F. Recolor all 'hubly' letters to PURE WHITE #FFFFFF. Essential: a truly TRANSPARENT alpha background everywhere outside the exact silhouettes AND inside ALL letter counters. Clean white letters without ANY white residue, fuzzy pixels, white background patches, halos or extra marks around them. The only opaque pixels must belong to the cat silhouette, its features, or the five letter silhouettes. NO white backdrop. NO white paint splashes. NO white rectangles. NO glow. NO outline. NO distress. Exact smooth clean solid flat graphic logo with perfect crisp antialiasing, moderate transparent safe margins. Only the cat head and lowercase word hubly. No redesign, mockup, texture, shading, gradients, labels or shadows. This is a clean production asset for placing over dark backgrounds.

