const frames = Array.from({length:18},(_,i)=>{
  const r=30+i*10, gap=12+i*1.5;
  return '<path transform="rotate('+i*7+' 300 300)" d="M '+(300+r)+' '+(300-gap)+' V '+(300-r)+' H '+(300-r)+' V '+(300+r)+' H '+(300+r)+' V '+(300+gap)+'"/>';
}).join('');
const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-labelledby="title desc"><title id="title">One open side</title><desc id="desc">Eighteen pale incomplete square frames turn around an empty dark center. A single copper curve rests outside them.</desc><rect width="600" height="600" fill="#102d35"/><g fill="none" stroke="#e6e0cf" stroke-width="1.5" stroke-linecap="round">'+frames+'</g><path d="M 437 500 Q 505 470 525 398" fill="none" stroke="#e39a70" stroke-width="4" stroke-linecap="round"/></svg>';
console.log(svg);
