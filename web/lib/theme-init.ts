/** Se ejecuta antes de pintar para evitar un destello del tema equivocado. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem("hubly-theme");if(!t&&matchMedia("(prefers-color-scheme: dark)").matches)t="dark";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
