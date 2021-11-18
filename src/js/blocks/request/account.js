import React, { useEffect, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { Controller, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";

export default function Account({control}) {
    const [splitToggle,setSplitToggle] = useState(false);
    const posType = useWatch({name:'posType',control:control});
    const accounts = ['one','two','three','four','five'];
    return (
        <article>
            <header>
                <Row>
                    <Col><h3>Account</h3></Col>
                </Row>
            </header>
            {(posType=='F') && 
                <Form.Group as={Row}>
                    <Form.Label column md={2}>Expenditure Type:</Form.Label>
                    <Col xs="auto">
                        <Controller
                            name="expType"
                            defaultValue=""
                            control={control}
                            render={({field}) => (
                                <>
                                    <Form.Check {...field} inline type="radio" label="PSR" value='PSR' checked={field.value=='PSR'}/>
                                    <Form.Check {...field} inline type="radio" label="PST" value='PST' checked={field.value=='PST'}/>
                                </>
                            )}
                        />
                    </Col>
                </Form.Group>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Org Name:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="orgName"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>SUNY Account:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name="SUNYAccount"
                        defaultValue=""
                        control={control}
                        render={({field}) => (
                            <InputGroup>
                                <Typeahead {...field} id="SUNYAccount" options={accounts} minLength={2} allowNew={true} disabled={splitToggle}/>
                                <InputGroup.Append>
                                    <Button variant={(splitToggle)?'primary':'secondary'} onClick={()=>setSplitToggle(!splitToggle)}>Split</Button>
                                </InputGroup.Append>
                            </InputGroup>
                        )}
                    />
                </Col>
            </Form.Group>
            {splitToggle && <AccountSplits/>}
        </article>
    );
    //<Form.Control {...field} type="text" placeholder="Enter SUNY Account" disabled={splitToggle}/>
}

function AccountSplits() {
    return (
        <Table striped bordered hover>
            <thead>
                <tr>
                    <th>Add/Remove</th>
                    <th>Account</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td> + / - </td>
                    <td>Total:</td>
                    <td>[sum of pct]</td>
                </tr>
            </tfoot>
            <tbody>
                <tr>
                    <td colSpan="2">[account]</td>
                    <td>[pct]</td>
                </tr>
            </tbody>
        </Table>
    );
}