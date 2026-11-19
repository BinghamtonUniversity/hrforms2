import React, { useState, useEffect } from "react";
import useSimulateQueries from "../../queries/simulate";
import { Row, Col, Form, Alert, Button, Table } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { t } from "../../config/text";

export default function AdminSimulate() {
    return (
        <section>
            <header className="mb-4">
                <Helmet>
                    <title>{t('admin.simulate.title')}</title>
                </Helmet>
                <Row>
                    <Col>
                        <h2>{t('admin.simulate.title')}</h2>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Alert variant="warning">
                            <p className="mb-0">This page is still in development and may not fully fuction.  Use with caution.</p>
                        </Alert>
                    </Col>
                </Row>
            </header>
            <DataForm/>
        </section>
    );
}

function DataForm() {
    const [type,setType] = useState('');
    const [id,setId] = useState('');
    const [showSimulate,setShowSimulate] = useState(false);
    return (
        <article>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Type:</Form.Label>
                <Col xs="auto">
                    <Form.Check inline label="Request" name="type" type="radio" id="type-request" checked={type==='request'} onChange={()=>setType('request')} disabled={showSimulate} />
                    <Form.Check inline label="Form" name="type" type="radio" id="type-form" checked={type==='form'} onChange={()=>setType('form')} disabled={showSimulate} />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>ID:</Form.Label>
                <Col xs="auto">
                    <Form.Control type="text" placeholder="Enter ID" value={id} onKeyDown={e=>{ if (e.key === 'Enter') setShowSimulate(true); }} onChange={e=>setId(e.target.value)} disabled={type === ''||showSimulate} />
                </Col>
            </Form.Group>
            <Row>
                <Col>
                    <Button variant="primary" onClick={()=>setShowSimulate(true)} disabled={type === '' || id === ''}>Simulate</Button>
                    <Button variant="secondary" onClick={()=>{setType('');setId('');setShowSimulate(false);}} className="ml-2">Clear</Button>
                </Col>
            </Row>
            {showSimulate && <Simulate type={type} id={id}/>}
        </article>
    );
}


function Simulate({type,id}) {
    const {getSimulate} = useSimulateQueries();
    const {data,error,isLoading} = getSimulate(type,id);
    if (isLoading) return <p>Loading...</p>;
    if (error) return <Alert variant="danger">Error: {error.message}</Alert>;
    if (!data) return <Alert variant="warning">No data returned from simulation.</Alert>;
    return (
        <Table striped bordered hover size="sm" className="mt-4">
            <thead>
                <tr>
                    <th>Status</th>
                    <th>Group From</th>
                    <th>Group To</th>
                    <th>Subject</th>
                    <th>To</th>
                    <th>CC</th>
                    <th>Reply To</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row,index)=>{
                    const statusCode = Object.keys(row)[0];
                    return (
                        <tr key={index}>
                            <td>{statusCode}</td>
                            <td>{row[statusCode]['groups'][0]}</td>
                            <td>{row[statusCode]['groups'][1]}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    );
                })}
            </tbody>
        </Table>
    );
}
