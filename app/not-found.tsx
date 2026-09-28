import Link from 'next/link';
export default function NotFound(){return <main className="empty" style={{padding:'20vh 24px'}}><h1 className="serif">这条路径暂未展开</h1><p>回到图鉴，探索十二个知识专题。</p><Link href="/atlas">返回主题图鉴 →</Link></main>}
