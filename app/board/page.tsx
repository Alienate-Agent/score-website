export default async function BoardPage({searchParams}:{searchParams:Promise<{kind?:string;id?:string}>}){
  const params=await searchParams;
  const valid=(params.kind==='post'||params.kind==='comment')&&/^[1-9]\d*$/.test(params.id??'')&&Number.isSafeInteger(Number(params.id));
  return <main className="board-reader-page"><a href="/#story-title">The artists are still owed ↑</a><h1>Board conversation</h1>
    {valid?<a id="board-reopen" href={`/board?kind=${params.kind}&id=${params.id}`}>Open {params.kind} {params.id} and its replies</a>:<p>This link does not identify a board post or comment.</p>}
    <noscript>This reader needs JavaScript to open the conversation.</noscript>
  </main>;
}
