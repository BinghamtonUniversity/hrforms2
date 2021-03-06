import React, { useEffect } from "react";
import { Alert, Button, Modal, ListGroup, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { parse, format } from "date-fns";
import { invoke, get, capitalize } from "lodash";
import { Icon } from '@iconify/react';
import { SettingsContext } from "../app";
import { useUserQueries } from "../queries";

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
    'deactivate-group':{icon:'mdi:account-multiple-remove',variant:'warning'},
    'deactivate-user':{icon:'mdi:account-remove',variant:'warning'},
    'delete':{icon:'mdi:delete',variant:'danger'},
    'edit':{icon:'mdi:pencil',variant:'primary'},
    'impersonate':{icon:'mdi:account-switch',variant:'primary'},
    'loading':{icon:'mdi:loading',variant:'secondary',spin:true},
    'next':{icon:'mdi:arrow-right-thick',variant:'primary'},
    'save':{icon:'mdi:content-save',variant:'primary'},
    'save-move':{icon:'mdi:content-save-move',variant:'primary'},
    'search':{icon:'mdi:magnify',variant:'primary'},
    'submit':{icon:'mdi:content-save-chcek',variant:'primary'},
    'undo':{icon:'mdi:undo',variant:'secondary'},
};

const Loading = React.memo(function Loading({children,className='',isError,error,variant,type}){
    const icon = (isError)?<Icon icon="mdi:alert" className="iconify-inline"/>:<Icon icon="mdi:loading" className="spin iconify-inline"/>;
    const cl = (isError)?`text-danger ${className}`:className;
    const vr = (isError)?'danger':(variant)?variant:'light';
    if (type == 'alert') {
        return <Alert variant={vr} className={`text-center ${cl}`}>{icon} {children}</Alert>
    } else {
        return <span className={cl}>{icon} {children} {error && <small>({error?.name && <>{error?.name} - </>}{error?.message})</small>}</span>
    }
});

export function DateFormat({children,inFmt,outFmt,nvl=null}) {
    const iFmt = inFmt || 'dd-MMM-yy';
    const d = parse(children,iFmt,new Date());
    if (d=='Invalid Date'||!children) return nvl;
    const oFmt = outFmt || 'M/d/yyyy'; //TODO: global date default format and user date format
    return format(d,oFmt);
}

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
                <Button variant={get(buttons,'close.variant','secondary')} onClick={handleClose}>{get(buttons,'close.title','Close')}</Button>
                <Button variant={get(buttons,'confirm.variant','primary')} onClick={handleConfirm}>{get(buttons,'confirm.title','Confirm')}</Button>
            </Modal.Footer>
        </Modal>
    );
});

const AppButton = React.memo(({children,format,icon,spin,...props}) => {
    return (
        <Button {...props} className={(!children)&&'no-label'} variant={props.variant||formats[format].variant}>{format!='none'&&<Icon className={(spin||formats[format].spin)&&'spin'} icon={icon||formats[format].icon}/>}{children}</Button>
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
    if (counts.isLoading) {
        if (showOn == 'home') return <ListGroup.Item className="d-flex justify-content-center"><Loading>Loading...</Loading></ListGroup.Item>
        if (showOn == 'menu') return <NavDropdown.Item><Loading>Loading...</Loading></NavDropdown.Item>;
        return null;
    } 
    return (
        <SettingsContext.Consumer>
        {settings=>{
            const single = menu.slice(0,-1);
            return (
                <>
                    {(showNew && showOn=='home') && <Link key={`${menu}.new`} to={`/${single}/`} component={DashBoardListComponent}><span className="font-italic">New {capitalize(single)}</span></Link> }
                    {(showNew && showOn=='menu') && 
                        <>
                            <NavDropdown.Item as={Link} to={single}>New {capitalize(single)}</NavDropdown.Item>
                            <NavDropdown.Divider/>

                        </>
                    }
                    {Object.keys(counts.data[menu]).map(l=>{
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

export {Loading,ModalConfirm,AppButton,MenuCounts,errorToast};
