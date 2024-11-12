// General Application Configurations
import { formats } from "../blocks/components";
import { get } from "lodash";

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
export const icons = Array.from(new Set(Object.values(formats).map(f=>get(f,'preload',true)&&f.icon)));
