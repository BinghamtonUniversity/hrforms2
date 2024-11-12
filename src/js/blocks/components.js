import React, { useEffect, useState } from "react";
import { Alert, Button, Modal, ListGroup, NavDropdown, Form, OverlayTrigger, Popover, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import { parse, format } from "date-fns";
import { invoke, get, capitalize, isDate } from "lodash";
import { Icon } from '@iconify/react';
import { SettingsContext, useSettingsContext, useAuthContext } from "../app";
import useUserQueries from "../queries/users";
import CheckboxTree from 'react-checkbox-tree';
import { useLocation } from "react-router-dom";
import useListsQueries from "../queries/lists";

/** Table Of Contents * 
 * 
 * Loading
 * DateFormat
 * CurrencyFormat
 * ModalConfirm
 * AppButton
 * MenuCounts
 * DashBoardListComponent
 * errorToast
 * ErrorToastComponent
 * CheckboxTreeComponent
 * StateSelector
 * CountrySelector
 * DepartmentSelector
 * DescriptionPopover
 * WorkflowExpandedComponent
 */

/* formats for AppButton */
// 'key':{icon:<iconName>,variant:<bootstrap_variant>,[preload:false]}
// use "preload:false" to prevent icon from being loaded on app start.
export const formats = {
    'add':{icon:'mdi:plus',variant:'success'},
    'add-group':{icon:'mdi:account-multiple-plus',variant:'success'},
    'add-list':{icon:'mdi:playlist-plus',variant:'success'},
    'add-user':{icon:'mdi:account-plus',variant:'success'},
    'activate-group':{icon:'mdi:account-multiple',variant:'success'},
    'activate-user':{icon:'mdi:account',variant:'success'},
    'approve':{icon:'mdi:check',variant:'success'},
    'cancel':{icon:'mdi:close-circle',variant:'danger'},
    'clear':{icon:'mdi:eraser-variant',variant:'secondary'},
    'close':{icon:'mdi:close-circle',variant:'secondary'},
    'collapse':{icon:'mdi:chevron-down',variant:'secondary'},
    'copy':{icon:'mdi:content-duplicate',variant:'warning-light'},
    'deactivate-group':{icon:'mdi:account-multiple-remove',variant:'warning'},
    'deactivate-user':{icon:'mdi:account-remove',variant:'warning'},
    'delete':{icon:'mdi:delete',variant:'danger'},
    'edit':{icon:'mdi:pencil',variant:'primary'},
    'expand':{icon:'mdi:chevron-right',variant:'secondary'},
    'exit':{icon:'mdi:arrow-left-circle',variant:'danger'},
    'filter':{icon:'mdi:filter',variant:'primary'},
    'impersonate':{icon:'mdi:account-switch',variant:'primary'},
    'info':{icon:'mdi:information-variant-circle-outline',variant:'primary'},
    'loading':{icon:'mdi:loading',variant:'secondary',spin:true},
    'next':{icon:'mdi:arrow-right-thick',variant:'primary'},
    'previous':{icon:'mdi:arrow-left-thick',variant:'secondary'},
    'print':{icon:'mdi:printer',variant:'primary'},
    'remove':{icon:'mdi:minus',variant:'danger'},
    'reject':{icon:'mdi:close-circle',variant:'danger'},
    'run':{icon:'mdi:run',variant:'danger'},
    'save':{icon:'mdi:content-save',variant:'primary'},
    'save-move':{icon:'mdi:content-save-move',variant:'primary'},
    'saving':{icon:'mdi:loading',variant:'primary',spin:true},
    'search':{icon:'mdi:magnify',variant:'primary'},
    'submit':{icon:'mdi:content-save-check',variant:'primary'},
    'top':{icon:'mdi:chevron-up',variant:'secondary'},
    'undo':{icon:'mdi:undo',variant:'secondary'},
    'upload':{icon:'mdi:file-upload',variant:'secondary'},
    'view':{icon:'mdi:eye-arrow-right',variant:'primary'},
};

const Loading = React.memo(function Loading({children,className='',isError,error,variant,type}){
    const icon = (isError)?<Icon icon="mdi:alert" className="iconify-inline"/>:<Icon icon="mdi:loading" className="spin iconify-inline"/>;
    const cl = (isError)?`text-danger ${className}`:className;
    const vr = (isError)?'danger':(variant)?variant:'light';
    const err = error && <small>({error?.name && <>{error?.name} - </>}{error?.message})</small>;
    if (type == 'alert') {
        return <Alert variant={vr} className={`text-center ${cl}`}>{icon} {children} {err}</Alert>
    } else {
        return <span className={cl}>{icon} {children} {err}</span>
    }
});

export function DateFormat({children,inFmt,outFmt,nvl}) {
    if (!children) return (nvl)?<em>{nvl}</em>:null;
    const iFmt = inFmt || 'dd-MMM-yy';
    const d = (isDate(children))?children:parse(children,iFmt,new Date());
    if (d=='Invalid Date') return (nvl)?<em>{nvl}</em>:null;
    const oFmt = outFmt || 'M/d/yyyy'; //TODO: global date default format and user date format
    return format(d,oFmt);
}

export function CurrencyFormat({children}) {
    return new Intl.NumberFormat('en-us',{
        currency:'USD',
        style:'currency',
    }).format(children);
}

/** 
 * buttons: {
 *      close:{title:'',variant:'',callback:()=>null},
 *      confirm:{title:'',variant:'',callback:()=>null}
 * }
 */
const ModalConfirm = React.memo(({children,show,title,buttons,icon,id}) => {
    const [isSaving,setIsSaving] = useState(false);
    const handleConfirm = () => {
        setIsSaving(true);
        invoke(buttons,'confirm.callback');
        setIsSaving(false);
    }
    const handleClose = () => {
        if (isSaving) return 0;
        invoke(buttons,'close.callback');
    }
    useEffect(()=>setIsSaving(false),[id]);
    return (
        <Modal id={`modal_confirm_${id||Date.now()}`} show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{icon&&<Icon className="iconify-inline" icon={icon} mr={2}/>}{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer>
                {isSaving && <Loading>Processing request...</Loading>}
                <AppButton 
                    format={get(buttons,'close.format','close')}
                    variant={get(buttons,'close.variant','')}
                    onClick={handleClose}
                    disabled={isSaving}
                >{get(buttons,'close.title','Close')}</AppButton>
                <AppButton 
                    format={get(buttons,'confirm.format','save')}
                    variant={get(buttons,'confirm.variant','')}
                    onClick={handleConfirm}
                    disabled={isSaving}
                >{get(buttons,'confirm.title','Confirm')}</AppButton>
            </Modal.Footer>
        </Modal>
    );
});

const AppButton = React.memo(({children,format,icon,spin,...props}) => {
    let cName = props.className?props.className:'';
    if (!children) cName += ' no-label';
    return (
        <Button {...props} className={cName} variant={props.variant||formats[format].variant}>{format!='none'&&<Icon className={(spin||formats[format].spin)&&'spin'} icon={icon||formats[format].icon}/>}{children}</Button>
    );
});

const MenuCounts = React.memo(({menu,showOn,showNew=false}) => {
    /* showOn: home or menu */
    const { getCounts } = useUserQueries();
    const location = useLocation();
    const counts = getCounts();
    if (counts.isError) {
        if (showOn == 'home') return <ListGroup.Item className="d-flex justify-content-center"><Loading isError>Error Loading</Loading></ListGroup.Item>;
        if (showOn == 'menu') return <NavDropdown.Item><Loading isError>Error Loading</Loading></NavDropdown.Item>;
        return null;
    }
    return (
        <SettingsContext.Consumer>
        {settings=>{
            // check number of drafts.  If over limit disabled New option.
            let overLimit = true;
            if (settings.general.draftLimit == 0) { // draft limit disabled via settings
                overLimit = false;
            } else {
                overLimit = get(counts.data,`${menu}.drafts.count`,settings.general.draftLimit) >= settings.general.draftLimit;
            }
            const single = menu.slice(0,-1);
            let linkTo = `/${single}/`;
            if (location.pathname.startsWith(linkTo)) linkTo += 'new';
            const menuItems = Object.keys(settings[menu].menu).sort((a,b) => parseInt(settings[menu].menu[a].order,10)>parseInt(settings['forms'].menu[b].order,10)?1:parseInt(settings[menu].menu[a].order,10)==parseInt(settings[menu].menu[b].order,10)?0:-1);
            return (
                <>
                    {(showNew && showOn=='home') && <Link key={`${menu}.new`} to={`/${single}/`} component={DashBoardListComponent} disabled={overLimit}><span className="font-italic">New {capitalize(single)}</span> {counts.isSuccess&&overLimit && <small className="text-danger"><Icon icon="mdi:alert" className="iconify-inline" style={{top:'-1px'}}/>draft limit exceeded</small>}</Link> }
                    {(showNew && showOn=='menu') && 
                        <>
                            <NavDropdown.Item as={Link} to={linkTo} disabled={overLimit}>New {capitalize(single)}</NavDropdown.Item>
                            <NavDropdown.Divider/>

                        </>
                    }
                    {(counts.isLoading&&showOn=='home') && <ListGroup.Item className="d-flex justify-content-center"><Loading>Loading...</Loading></ListGroup.Item>}
                    {(counts.isLoading&&showOn=='menu') && <NavDropdown.Item><Loading>Loading...</Loading></NavDropdown.Item>}
                    {counts.data && menuItems.map(l=>{
                        const key = `${menu}.menu.${l}`;
                        if (!get(settings,`${key}.enabled`,true)) return null;
                        const title = get(settings,`${key}.title`,l);
                        const show = get(settings,`${key}.showOn${capitalize(showOn)}`,false);
                        if (!show) return null;
                        const cnt = get(counts.data,`${menu}.${l}.count`,0);
                        const age = get(counts.data,`${menu}.${l}.age`,0);
                        const ageClass = {home:'',homeIcon:''};
                        /*TBD: if (age > 90) {
                            ageClass['home'] = 'list-group-item-danger'
                            ageClass['homeIcon'] = <><Icon icon="mdi:alert" className="iconify-inline"/>{' '}</>;
                        }*/
                        if (showOn == 'home') return <Link key={key} className={`d-flex justify-content-between ${ageClass.home}`} to={`/${single}/list/${l}`} component={DashBoardListComponent}><span>{ageClass.homeIcon}{title}</span>{cnt}</Link>;
                        if (showOn == 'menu') return <NavDropdown.Item key={l} as={Link} to={`/${single}/list/${l}`}>{title} {cnt!=null && <span>({cnt})</span>}</NavDropdown.Item>;
                    })}
                    
                </>
            );
        }}
        </SettingsContext.Consumer>
    );
});

const DashBoardListComponent = props => {
    return <ListGroup.Item className={props.className} href={props.href} action disabled={props.disabled}>{props.children}</ListGroup.Item>;
}

function errorToast(message) {
    return {
        render: ({data}) => {
            console.error(data);
            return <ErrorToastComponent message={message} description={data?.description}/>
        },
        autoClose: 10000
    };
}
const ErrorToastComponent = ({message,description}) => {
    return (
        <>
            <p className="mb-0">{message}</p>
            {description && <p className="mb-0"><small>({description})</small></p>}
        </>
    );
}

/* Icon defaults for CheckboxTree */
const iconSize = "22px"
const icons = {
    check: <Icon icon="mdi:checkbox-outline" width={iconSize} height={iconSize} />,
    halfCheck: <Icon icon="mdi:checkbox-outline" width={iconSize} height={iconSize} style={{color:'#999'}} />,
    uncheck: <Icon icon="mdi:checkbox-blank-outline" width={iconSize} height={iconSize} />,
    expandClose: <Icon icon="mdi:chevron-right" width={iconSize} height={iconSize} />,
    expandOpen: <Icon icon="mdi:chevron-down" width={iconSize} height={iconSize} />,
    leaf: null,
    parentClose: null,
    parentOpen: null,
}
/*
    expandAll: <span className="rct-icon rct-icon-expand-all" />,
    collapseAll: <span className="rct-icon rct-icon-collapse-all" />,
*/
const CheckboxTreeComponent = props => {
    return <CheckboxTree icons={icons} {...props}/>;
}

const StateSelector = ({field,...props}) => {
    const { getListData } = useListsQueries();
    const states = getListData('states');
    return (
        <>
            {states.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
            {states.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
            {states.data && 
                <Form.Control {...field} as="select" {...props}>
                    <option></option>
                    {states.data.map(s=><option key={s.abbr} value={s.abbr}>{s.abbr} - {s.name}</option>)}
                </Form.Control>
            }
        </>
    );
}

const CountrySelector = ({field,...props}) => {
    const { getListData } = useListsQueries();
    const countryCodes = getListData('countryCodes');
    return (
        <>
            {countryCodes.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
            {countryCodes.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
            {countryCodes.data && 
                <Form.Control {...field} as="select" {...props}>
                    <option></option>
                    {countryCodes.data.map(c=><option key={c.COUNTRY_CODE} value={c.COUNTRY_CODE}>{c.COUNTRY_SHORT_DESC}</option>)}
                </Form.Control>
            }
        </>
    );
}

const DepartmentSelector = ({field,...props}) => {
    const { getListData } = useListsQueries();
    const departments = getListData('deptOrgs');
    return (
        <>
            {departments.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
            {departments.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
            {departments.data && 
                <Form.Control {...field} as="select" {...props}>
                    <option></option>
                    {departments.data.map(d=><option key={d.DEPARTMENT_CODE} value={d.DEPARTMENT_CODE}>{d.DEPARTMENT_DESC}</option>)}
                </Form.Control>
            }
        </>
    );
}

const DescriptionPopover = ({title,content,showempty,children,...props}) => {
    if (!content&&!showempty) return children;
    const emptydisplay = (typeof(showempty)=='boolean')?"no description":showempty;
    const s = {};
    if (props.width) {
        s.maxWidth = 'none';
        s.width = `${props.width}em`;
    }
    return (
        <OverlayTrigger 
            key={props.id} 
            trigger={props?.trigger||['focus','hover']} 
            placement={props?.placement||"auto"} 
            flip={props?.flip}
            overlay={
                <Popover id={props.id} style={s}>
                    {title&&<Popover.Title>{title}</Popover.Title>}
                    <Popover.Content>{(!content)?(<span className="font-italic">{emptydisplay}</span>):content}</Popover.Content>
                </Popover>
            }
        >
            {children}
        </OverlayTrigger>
    );
}

/* Builds the workflow chart in Request and Form list pages */
const WorkflowExpandedComponent = ({data}) => {
    const [showSkipped,setShowSkipped] = useState(false);
    const { general } = useSettingsContext();
    const { isAdmin } = useAuthContext();
    useEffect(() => {
        setShowSkipped((isAdmin && general.showSkipped == 'a' || general.showSkipped == 'y'));
    },[general]);
    return (
        <div className="p-3" style={{backgroundColor:'#ddd'}}>
            {data.GROUPS_ARRAY.map((g,i)=>{
                const sequence = parseInt(data.SEQUENCE,10);
                const key = `${data.id}_${i}`;
                if (data.STATUS_ARRAY[i] == 'X' && !showSkipped) return null;
                let variant = 'white';
                let classname = 'p-2 m-0 d-inline-flex flex-column badge-outline border';
                let title = general.awaitLabel;
                if (i <= sequence) { 
                    switch(data.STATUS_ARRAY[i]) {
                        case "S":
                            classname += "-dark";
                            variant = 'secondary';
                            break;
                        case "X":
                            classname += '-dark badge-white-striped'
                            break;
                        case "R":
                            classname += '-danger';
                            variant = 'danger-light';
                            break;
                        case "PA":
                        case "PF":
                            classname += '-info';
                            variant = 'info-light';
                            break;
                        case "Z":
                            classname += '-dark';
                            variant = 'accent2';
                            break;    
                        default:
                            classname += '-success';
                            variant = 'success-light';
                    }
                    title = general.status[data.STATUS_ARRAY[i]].badge;
                }
                return (
                    <span key={key} className="my-1">
                        <DescriptionPopover
                            id={`workflow_description_${key}`}
                            title={title}
                            placement="top"
                            flip
                            content={<p>{g.GROUP_NAME}: {(!g.GROUP_DESCRIPTION)?<em>No group description</em>:g.GROUP_DESCRIPTION}</p>}
                        >
                            <Badge as="p" variant={variant} className={classname}>
                                <span>{g.GROUP_NAME}</span>
                                <span className="pt-1 font-italic">{title}</span>
                            </Badge>
                        </DescriptionPopover>
                        {(i<data.GROUPS_ARRAY.length-1)&&<span><Icon className="iconify-inline m-0 mt-1" icon="mdi:arrow-right"/></span>}
                    </span>
                );
            })}
        </div>
    );
}

export {Loading,ModalConfirm,AppButton,MenuCounts,errorToast,CheckboxTreeComponent,
    StateSelector,CountrySelector,DepartmentSelector,DescriptionPopover,WorkflowExpandedComponent};
