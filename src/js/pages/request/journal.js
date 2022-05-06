import React, { useState } from "react";
import useRequestQueries from "../../queries/requests";
import { Row, Col, Form, Button, Table } from "react-bootstrap";

export default function RequestJournal() {
    const [reqId,setReqId] = useState('');
    const [showResults,setShowResults] = useState(false);
    const handleChange = e => {
        setReqId(e.target.value);
    }
    const handleESC = e => {
        if (e.which === 27) {
            setShowResults(false);
            setReqId('');
        }
    }
    const handleSubmit = e => {
        e.preventDefault();
        setShowResults(true);
    }
    return (
        <>
            <Row>
                <Col><h2>Request Journal</h2></Col>
            </Row>
            <Form inline onSubmit={handleSubmit}>
                <Form.Label className="my-1 mr-2" htmlFor="journalReqIdSearch" >Request ID:</Form.Label>
                <Form.Control className="mb-2 mr-sm-2" id="journalReqIdSearch" value={reqId} onChange={handleChange} onKeyDown={handleESC} autoFocus/>
                <Button type="submit" className="mb-2">Search</Button>
            </Form>
            {(showResults && !reqId) && <p>You must enter a request id</p>}
            {(showResults && reqId) && <JournalSearchResults reqId={reqId}/>}
        </>
    );
}

function JournalSearchResults({reqId}) {
    const {getJournal} = useRequestQueries(reqId);
    const journal = getJournal();
    if (journal.isLoading) return <p>Loading...</p>;
    if (journal.isError) return <p>Error</p>;
    return (
        <Table bordered striped>
            <thead>
                <tr>
                    <th>Information</th>
                    <th>Comments</th>
                </tr>
            </thead>
            <tbody>
                {journal.data.map(j => (
                    <tr key={j.SEQUENCE}>
                        <td>
                            <dl>
                                <dt>Sequence</dt>
                                <dd>{j.SEQUENCE}</dd>
                                <dt>Date</dt>
                                <dd>{j.JOURNAL_DATE}</dd>
                            </dl>
                        </td>
                        <td>
                            {j.COMMENTS}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    )
}