import React, { useEffect, useMemo, useState } from "react";
import { Row, Col, Form, InputGroup, Button, Table } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import { Controller, useWatch } from "react-hook-form";
import { useAppQueries } from "../../queries";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function Account({control,getValues,setValue}) {
    const [splitToggle,setSplitToggle] = useState(false);
    const posType = useWatch({name:'posType',control:control});
    const toggleSplit = () => {
        if (!splitToggle) {
            const temp = getValues('split');
            if (!temp) setValue('split',[{account:'',pct:''},{account:'',pct:''}]);
        }
        setSplitToggle(!splitToggle);        
    }
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
                                    <Button variant={(splitToggle)?'primary':'secondary'} onClick={toggleSplit}>Split</Button>
                                </InputGroup.Append>
                            </InputGroup>
                        )}
                    />
                </Col>
            </Form.Group>
            {splitToggle && <AccountSplits control={control} getValues={getValues} setValue={setValue}/>}
        </article>
    );
    //<Form.Control {...field} type="text" placeholder="Enter SUNY Account" disabled={splitToggle}/>
}

function AccountSplits({control,getValues,setValue}) {
    const [splitPct,setSplitPct] = useState(0);
    const [splits,setSplits] = useState(getValues('split'));
    const watchSplit = useWatch({name:'split',control:control});

    //probably a reducer
    const addRow = () => {
        const temp = [...getValues('split')];
        temp.push({account:'',pct:''});
        setValue('split',temp);
    };
    const removeRow = e => {
        const temp = [...getValues('split')];
        const idx = e.target.closest('tr').dataset.rowId;
        console.log(idx);
        temp.splice(idx,1);
        console.log(temp);
        setValue('split',temp);
    };

    useEffect(() => {
        if (!watchSplit) return;
        console.log(watchSplit);
        setSplits(watchSplit);
        /*if (watchSplit.length == 1) {
            setSplitPct(watchSplit[0].pct);
        } else {
            setSplitPct(watchSplit.reduce((a,b)=>parseInt(a.pct||0,10)+parseInt(b.pct||0,10)));
        }*/
    },[watchSplit]);
    return (
        <Table className="split-account-table" striped bordered>
            <thead>
                <tr>
                    <th scope="col">Action</th>
                    <th scope="col">Account</th>
                    <th scope="col">Percent</th>
                </tr>
            </thead>
            <tfoot>
                <tr>
                    <td colSpan={2}>Total:</td>
                    <td className="text-right"><span className={(splitPct==100)?'text-success':'text-danger'}>{splitPct}%</span></td>
                </tr>
            </tfoot>
            <tbody>
                {splits.map((v,i)=>(
                    <tr key={i} data-row-id={i}>
                        <td>
                            <Button className="mr-2" variant="success" size="sm" onClick={addRow}><FontAwesomeIcon icon="plus-square"/></Button>
                            <Button variant="danger" size="sm" onClick={removeRow}><FontAwesomeIcon icon="minus-square"/></Button></td>
                        <td>
                            <Controller
                                name={`split[${i}].account`}
                                defaultValue={v.account}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text"/>}
                            />
                        </td>
                        <td className="text-right">
                        <Controller
                                name={`split[${i}].pct`}
                                defaultValue={v.pct}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="text"/>}
                            />
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}
