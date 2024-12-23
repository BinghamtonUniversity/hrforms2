// General Application Configurations
import { formats } from "../blocks/components";
import { get } from "lodash";
import bracesIcon from "../../images/mdi--code-braces.png";

const mustacheVarsList = {
    FORM_ID:'Form ID',
    REQUEST_ID:'Request ID',
    MAILTO: 'Email addresses(s) to send to',
    MAILCC: 'Email addresses(s) to CC',
    REPLYTO: 'Email address to reply to',
    STATUS: 'The status code of the Form/Request',
    SEQ: 'The sequence number of the Form/Request',
    GROUPS: 'The groups associated with the Form/Request',
    GROUP_FROM: 'The group the Form/Request was sent from',
    GROUP_TO: 'The group the Form/Request was sent to',
    SUBMITTED_BY: 'The SUNY ID of the user who submitted the Form/Request',
};

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
            controls: {
                mustacheVars: {
                    iconURL: bracesIcon,
                    tooltip: "Add replacement variables",
                    list: Object.keys(mustacheVarsList).sort().reduce((Obj,key) => {
                        Obj[key] = mustacheVarsList[key];
                        return Obj;
                    },{}),
                    childTemplate: (editor,key,value) => {
                        return `<span title="${value}">${key}</span>` ;
                    },
                    exec: (editor,_,{ control }) => {
                        let value = control.args && control.args[0]; 
                        if (!value) return false;
                        editor.s.insertHTML(`{{${value}}}`);
                    }
                }
            },
            enter:"br",
            buttons:['bold','italic','underline','strikethrough','eraser','|','superscript','subscript','|','ul','ol','|','indent','outdent','align','|','paragraph','font','fontsize','brush','|','copy','cut','paste','selectall','|','undo','redo','|','hr','link','table','symbol','mustacheVars','|','source','print','fullsize','|','about'],
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
