import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function VersionInfo() {
    const [markdown,setMarkDown] = useState('');
    useEffect(() => {
        fetch('CHANGELOG.md').then(r=>r.text()).then(t => {
            setMarkDown(t);
        });
    },[]);
    return (
        <section>
            <ReactMarkdown 
                children={markdown}
                remarkPlugins={[remarkGfm]}
                components={{
                    h1:'h2',
                    h2:'h3',
                    h3:'h4',
                    h4:'h5'
                }}
            />
        </section>
    );
}