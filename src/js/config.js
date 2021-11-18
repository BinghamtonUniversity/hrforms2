// configuration values
export function editorConfig(...args) {
    return {
        showXPathInStatusbar:false,
        buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','|','fullsize','|','about'],
        buttonsMD:["bold","italic","underline","|","ul","ol","|","indent","outdent","align","|","font","fontsize","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
        buttonsSM:["bold","italic","|","ul","ol","|","indent","outdent","align","|","font","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
        buttonsXS:["bold","italic","|","ul","ol","|","font","fontsize","align","|","copy","cut","paste","|","link","|","dots"],
        disablePlugins: "video,file,preview,print,drag-and-drop,drag-and-drop-element,iframe,media,image,image-processor,image-properties"
    };
}
