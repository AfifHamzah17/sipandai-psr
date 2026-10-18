const c=n=>`rgb(var(--${n}) / <alpha-value>)`;
export default {darkMode:'class',content:['./index.html','./src/**/*.{js,jsx}'],
theme:{extend:{colors:{bg:c('bg'),surface:c('surface'),ink:c('ink'),mute:c('mute'),line:c('line'),palm:c('palm'),forest:c('forest'),tint:c('tint'),onpalm:c('onpalm')},
fontFamily:{sans:['"Geist Variable"','system-ui','sans-serif'],mono:['"Geist Mono Variable"','ui-monospace','monospace']}}},plugins:[]};
