import React from "react";
import {Alert,Button,Modal} from "react-bootstrap";
import {parse,format} from "date-fns";
import invoke from "lodash/invoke";
import get from "lodash/get";
import { Icon } from '@iconify/react';

const icons = {
    'add':{icon:'mdi:plus',variant:'success'},
    'add-group':{icon:'mdi:account-multiple-plus',variant:'success'},
    'add-list':{icon:'mdi:playlist-plus',variant:'success'},
    'add-user':{icon:'mdi:account-plus',variant:'success'},
    'activate-group':{icon:'mdi:account-multiple',variant:'success'},
    'activate-user':{icon:'mdi:account',variant:'success'},
    'cancel':{icon:'mdi:close-circle',variant:'danger'},
    'deactivate-group':{icon:'mdi:account-multiple-remove',variant:'warning'},
    'deactivate-user':{icon:'mdi:account-remove',variant:'warning'},
    'delete':{icon:'mdi:delete',variant:'danger'},
    'edit':{icon:'mdi:pencil',variant:'primary'},
    'impersonate':{icon:'mdi:account-switch',variant:'primary'},
    'loading':{icon:'mdi:loading',variant:'secondary',spin:true},
    'next':{icon:'mdi:arrow-right-thick',variant:'primary'},
    'save':{icon:'mdi:content-save',variant:'primary'},
    'save-move':{icon:'mdi:content-save-move',variant:'primary'},
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
        <Button {...props} className={(!children)&&'no-label'} variant={props.variant||icons[format].variant}>{format!='none'&&<Icon className={(spin||icons[format].spin)&&'spin'} icon={icon||icons[format].icon}/>}{children}</Button>
    );
});

export {Loading,ModalConfirm,AppButton};
