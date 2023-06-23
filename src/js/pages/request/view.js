import React, { useState, useEffect } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { useForm, FormProvider } from "react-hook-form";
import { Redirect, useHistory, useParams } from "react-router-dom";
import { get, merge } from "lodash";
import { AppButton } from "../../blocks/components";

export default function RequestArchiveView() {
    const { id } = useParams();
    const history = useHistory();

    const [showReturn,setShowReturn] = useState(false);
    const [redirect,setRedirect] = useState('');

    const handleReturnToList = () => setRedirect(get(history.location,'state.from',''));
    useEffect(()=>setShowReturn(get(history.location,'state.from','').startsWith('/form/list')),[history]);

    if (redirect) return <Redirect to={redirect}/>;
    return (
        <>
            <section>
                <header>
                    <Row>
                        <Col>
                            <h2>Archive View {showReturn && <AppButton format="previous" onClick={handleReturnToList}>Return to List</AppButton>}</h2>
                        </Col>
                    </Row>
                </header>
                <Alert variant="warning">
                    {/*TODO: finish */}
                    This page is still under construction and may not display all information correctly.
                </Alert>
            </section>
        </>
    );
}
/*                {formData.data && <HRFormViewData data={formData.data}/>}*/
