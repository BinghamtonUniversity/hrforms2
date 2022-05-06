import React from "react";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";

export default function Testing() {
    const notify = () => {
        toast.info('It Worked!');
        toast.error('It did not work',{autoClose:10000}); 
    }
    return (
        <div>
            <Button onClick={notify}>Toast!</Button>
        </div>
    );
}