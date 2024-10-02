// General Application Configurations

// Editor Configuration
export function editorConfig(...args) {
    if (args[0] == 'source') {
        return {
            className: 'template_editor',
            showXPathInStatusbar:false,
            sourceEditorNativeOptions: {
                theme: 'ace/theme/chrome',
                wrap: false
            },
            enter:"br",
            buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','|','source','print','fullsize','|','about'],
            buttonsMD:["bold","italic","underline","|","ul","ol","|","indent","outdent","align","|","font","fontsize","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsSM:["bold","italic","|","ul","ol","|","indent","outdent","align","|","font","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsXS:["bold","italic","|","ul","ol","|","font","fontsize","align","|","copy","cut","paste","|","link","|","dots"],
            disablePlugins: "video,file,preview,print,drag-and-drop,drag-and-drop-element,iframe,media,image,image-processor,image-properties"
        };
    } else {
        return {
            showXPathInStatusbar:false,
            buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','|','fullsize','|','about'],
            buttonsMD:["bold","italic","underline","|","ul","ol","|","indent","outdent","align","|","font","fontsize","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsSM:["bold","italic","|","ul","ol","|","indent","outdent","align","|","font","brush","|","copy","cut","paste","|","undo","redo","|","link","|","dots"],
            buttonsXS:["bold","italic","|","ul","ol","|","font","fontsize","align","|","copy","cut","paste","|","link","|","dots"],
            disablePlugins: "video,file,preview,print,drag-and-drop,drag-and-drop-element,iframe,media,image,image-processor,image-properties"
        };
    }
}

// DataTables Configuration
export const datatablesConfig = {
    paginationRowsPerPageOptions:[10,20,30,40,50,100],
    paginationComponentOptions:{
        selectAllRowsItem: true
    }
}

// Preload Icons
export const icons = [
    "mdi:account",
    "mdi:account-multiple",
    "mdi:account-multiple-plus",
    "mdi:account-multiple-remove",
    "mdi:account-plus",
    "mdi:account-remove",
    "mdi:account-switch",
    "mdi:arrow-left-circle",
    "mdi:arrow-left-thick",
    "mdi:arrow-right",
    "mdi:arrow-right-thick",
    "mdi:check",
    "mdi:chevron-down",
    "mdi:chevron-right",
    "mdi:chevron-up",
    "mdi:close-circle",
    "mdi:close-circle",
    "mdi:close-circle",
    "mdi:content-duplicate",
    "mdi:content-save",
    "mdi:content-save-check",
    "mdi:content-save-move",
    "mdi:delete",
    "mdi:eraser-variant",
    "mdi:eye-arrow-right",
    "mdi:file-upload",
    "mdi:information-variant-circle-outline",
    "mdi:loading",
    "mdi:loading",
    "mdi:magnify",
    "mdi:minus",
    "mdi:newspaper",
    "mdi:pencil",
    "mdi:playlist-plus",
    "mdi:plus",
    "mdi:printer",
    "mdi:run",
    "mdi:undo"
];