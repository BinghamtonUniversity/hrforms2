import React, { useEffect, useState } from "react";
import {Alert,Button,Modal} from "react-bootstrap";
import {parse,format} from "date-fns";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

/*
const LoadingOLD = React.memo(function LoadingOLD({className='',title,error,type,variant='dark'}) {
    const icon = (error)?<FontAwesomeIcon icon="exclamation-triangle"/>:<FontAwesomeIcon icon="sync" spin/>;
    const cl = (error)?'text-danger '+className:className;
    const message = `${(error)?'Error':''} Loading ${title}`;
    if (type == 'alert') {
        return <Alert variant={variant} className="text-center">{icon} {message} {error && <small>({error?.name} - {error?.message})</small>}</Alert>
    } else {
        return <span className={cl}>{icon} {message} {error && <small>({error?.name} - {error?.message})</small>}</span>
    }
});
*/
const Loading = React.memo(function Loading({children,className='',isError,error,variant,type}){
    const icon = (isError)?<FontAwesomeIcon icon="exclamation-triangle"/>:<FontAwesomeIcon icon="sync" spin/>;
    const cl = (isError)?`text-danger ${className}`:className;
    if (type == 'alert') {
        return <Alert variant={variant||'dark'} className={`text-center ${cl}`}>{icon} {children}</Alert>
    } else {
        return <span className={cl}>{icon} {children} {error && <small>({error?.name && <>{error?.name} - </>}{error?.message})</small>}</span>
    }
});
export {Loading}

export function DateFormat({children,inFmt,outFmt,nvl=null}) {
    const iFmt = inFmt || 'dd-MMM-yy';
    const d = parse(children,iFmt,new Date());
    if (d=='Invalid Date'||!children) return nvl;
    const oFmt = outFmt || 'M/d/yyyy'; //TODO: global date default format and user date format
    return format(d,oFmt);
}

const ModalConfirm = React.memo(({children,show,title,buttons}) => {
    const handleClose = () => {
        buttons?.close?.callback&&buttons.close.callback();
    }
    const handleConfirm = () => {
        buttons?.confirm?.callback&&buttons.confirm.callback();
    }
    return (
        <Modal show={show} onHide={handleClose} backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            <Modal.Footer>
                <Button variant={buttons?.close?.variant||'secondary'} onClick={handleClose}>{buttons?.close?.title||'Close'}</Button>
                <Button variant={buttons?.confirm?.variant||'primary'} onClick={handleConfirm}>{buttons?.confirm?.title||'Confirm'}</Button>
            </Modal.Footer>
        </Modal>
    );
});
export {ModalConfirm};
