type ThreadAct = {key:string; id:number; kind:string; parent_id:number|null};
export type ThreadNode<T> = {act:T; children:ThreadNode<T>[]};

/** Only explicit, available parent IDs create reply branches. Broken cycles stay roots. */
export function conversationTree<T extends ThreadAct>(acts:T[]):ThreadNode<T>[] {
  const nodes=acts.map(act=>({act,children:[] as ThreadNode<T>[]}));
  const comments=new Map(nodes.filter(n=>n.act.kind==='comment').map(n=>[n.act.id,n]));
  const roots:ThreadNode<T>[]=[];
  for(const node of nodes){
    const parent=node.act.kind==='comment'&&node.act.parent_id!==null?comments.get(node.act.parent_id):undefined;
    let cursor=parent;
    const seen=new Set([node.act.id]);
    let cycle=false;
    while(cursor){
      if(seen.has(cursor.act.id)){cycle=true;break;}
      seen.add(cursor.act.id);
      cursor=cursor.act.parent_id===null?undefined:comments.get(cursor.act.parent_id);
    }
    if(parent&&!cycle)parent.children.push(node);else roots.push(node);
  }
  return roots;
}
