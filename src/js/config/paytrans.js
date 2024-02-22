/* routing options */
const config = {
    //TODO: this could be moved to the settings UI tabs.
    disableDelete: false, //Globally disable delete on all form transactions tabs.
    hideDelete: false, //Globally hide delete on all form transactions tabs.
    actions: {
        copy: {format:'copy', name:"copy", title:'Copy', disabled:false},
        edit: {format:'edit', name:"edit", title:'Edit', disabled:false},
        delete: {format:'delete', name:"delete", title:'Delete', disabled:false},
    },
    routeBy: {
        'P':'Position Dept',
        'S':'Submitter Dept'
    }
}
export default config;
