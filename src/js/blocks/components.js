import React from "react";
import { Alert, Button, Modal, ListGroup, NavDropdown, Form } from "react-bootstrap";
import { Link } from "react-router-dom";
import { parse, format } from "date-fns";
import { invoke, get, capitalize, isDate } from "lodash";
import { Icon } from '@iconify/react';
import { SettingsContext } from "../app";
import { useUserQueries, useAppQueries } from "../queries";
import CheckboxTree from 'react-checkbox-tree';

/** Table Of Contents * 
 * 
 * Loading
 * DateFormat
 * ModalConfirm
 * AppButton
 * MenuCounts
 * DashBoardListComponent (TODO: this should probably be moved back to home)
 * errorToast
 * ErrorToastComponent
 * CheckboxTreeComponent
 * StateSelector
 * CountrySelector
 * DepartmentSelector
 */

/* formats for AppButton */
const formats = {
    'add':{icon:'mdi:plus',variant:'success'},
    'add-group':{icon:'mdi:account-multiple-plus',variant:'success'},
    'add-list':{icon:'mdi:playlist-plus',variant:'success'},
    'add-user':{icon:'mdi:account-plus',variant:'success'},
    'activate-group':{icon:'mdi:account-multiple',variant:'success'},
    'activate-user':{icon:'mdi:account',variant:'success'},
    'cancel':{icon:'mdi:close-circle',variant:'danger'},
    'clear':{icon:'mdi:eraser-variant',variant:'secondary'},
    'close':{icon:'mdi:close-circle',variant:'secondary'},
    'copy':{icon:'mdi:content-duplicate',variant:'primary'},
    'deactivate-group':{icon:'mdi:account-multiple-remove',variant:'warning'},
    'deactivate-user':{icon:'mdi:account-remove',variant:'warning'},
    'delete':{icon:'mdi:delete',variant:'danger'},
    'edit':{icon:'mdi:pencil',variant:'primary'},
    'impersonate':{icon:'mdi:account-switch',variant:'primary'},
    'loading':{icon:'mdi:loading',variant:'secondary',spin:true},
    'next':{icon:'mdi:arrow-right-thick',variant:'primary'},
    'run':{icon:'mdi:run',variant:'danger'},
    'save':{icon:'mdi:content-save',variant:'primary'},
    'save-move':{icon:'mdi:content-save-move',variant:'primary'},
    'saving':{icon:'mdi:loading',variant:'primary',spin:true},
    'search':{icon:'mdi:magnify',variant:'primary'},
    'submit':{icon:'mdi:content-save-check',variant:'primary'},
    'undo':{icon:'mdi:undo',variant:'secondary'},
    'upload':{icon:'mdi:file-upload',variant:'secondary'},
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
const ModalConfirm = React.memo(({children,show,title,buttons,icon}) => {
    const handleClose = () => invoke(buttons,'close.callback');
    const handleConfirm = () => invoke(buttons,'confirm.callback');
    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{icon&&<Icon className="iconify-inline" icon={icon} mr={2}/>}{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer>
                <AppButton 
                    format={get(buttons,'close.format','close')}
                    variant={get(buttons,'close.variant','')}
                    onClick={handleClose}
                >{get(buttons,'close.title','Close')}</AppButton>
                <AppButton 
                    format={get(buttons,'confirm.format','save')}
                    variant={get(buttons,'confirm.variant','')}
                    onClick={handleConfirm}
                >{get(buttons,'confirm.title','Confirm')}</AppButton>
            </Modal.Footer>
        </Modal>
    );
});

const AppButton = React.memo(({children,format,icon,spin,...props}) => {
    let cName = props.className;
    if (!children) cName += ' no-label';
    return (
        <Button {...props} className={cName} variant={props.variant||formats[format].variant}>{format!='none'&&<Icon className={(spin||formats[format].spin)&&'spin'} icon={icon||formats[format].icon}/>}{children}</Button>
    );
});

const MenuCounts = React.memo(({menu,showOn,showNew=false}) => {
    /* showOn: home or menu */
    const {getCounts} = useUserQueries();
    const counts = getCounts();
    if (counts.isError) {
        if (showOn == 'home') return <p>error</p>;
        if (showOn == 'menu') return <p>error</p>;
        return null;
    }
    /*if (counts.isLoading) {
        if (showOn == 'home') return <ListGroup.Item className="d-flex justify-content-center"><Loading>Loading...</Loading></ListGroup.Item>
        if (showOn == 'menu') return <NavDropdown.Item><Loading>Loading...</Loading></NavDropdown.Item>;
        return null;
    }*/
    return (
        <SettingsContext.Consumer>
        {settings=>{
            const single = menu.slice(0,-1);
            return (
                <>
                    {(showNew && showOn=='home') && <Link key={`${menu}.new`} to={`/${single}/`} component={DashBoardListComponent}><span className="font-italic">New {capitalize(single)}</span></Link> }
                    {(showNew && showOn=='menu') && 
                        <>
                            <NavDropdown.Item as={Link} to={`/${single}/`}>New {capitalize(single)}</NavDropdown.Item>
                            <NavDropdown.Divider/>

                        </>
                    }
                    {(counts.isLoading&&showOn=='home') && <ListGroup.Item className="d-flex justify-content-center"><Loading>Loading...</Loading></ListGroup.Item>}
                    {(counts.isLoading&&showOn=='menu') && <NavDropdown.Item><Loading>Loading...</Loading></NavDropdown.Item>}
                    {counts.data && Object.keys(counts.data[menu]).map(l=>{
                        const key = `${menu}.menu.${l}`;
                        if (!get(settings,`${key}.enabled`,true)) return null;
                        const title = get(settings,`${key}.title`,l);
                        const show = get(settings,`${key}.showOn${capitalize(showOn)}`,false);
                        if (!show) return null;
                        const cnt = get(counts.data,`${menu}.${l}`,0);
                        if (showOn == 'home') return <Link key={key} className="d-flex justify-content-between" to={`/${single}/list/${l}`} component={DashBoardListComponent}><span>{title}</span>{cnt}</Link>;
                        if (showOn == 'menu') return <NavDropdown.Item key={l} as={Link} to={`/${single}/list/${l}`}>{title} ({cnt})</NavDropdown.Item>;
                    })}
                </>
            );
        }}
        </SettingsContext.Consumer>
    );
});

const DashBoardListComponent = props => {
    return <ListGroup.Item className={props.className} href={props.href} action>{props.children}</ListGroup.Item>;
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
    const { getListData } = useAppQueries();
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
    const { getListData } = useAppQueries();
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
    const { getListData } = useAppQueries();
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

export {Loading,ModalConfirm,AppButton,MenuCounts,errorToast,CheckboxTreeComponent,
    StateSelector,CountrySelector,DepartmentSelector};
