import React,{ useState } from "react";
import { Link, Redirect } from "react-router-dom";
import { Navbar, Nav, NavDropdown } from "react-bootstrap";
import { useAuthContext } from "../app";
import capitalize from "lodash/capitalize";
import { MenuCounts } from "./components";

export default function AppNav() {
    const {isAdmin,OVR_SUNY_ID} = useAuthContext();
    const logout = e => {
        e.preventDefault();
        console.log('logout');
    }
    //TODO: check a/b match; if different and isAdmin then impersonation; otherwise kickout.
    //(!isAdmin && SUNY_ID != user.SUNY_ID)
    return (
        <header>
            <Navbar bg="main" variant="dark" expand="lg" className="mb-4 shadow" fixed="top" collapseOnSelect={true}>
                <Navbar.Brand href="#home">HR Forms 2</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                    <Nav>
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        {['requests','forms'].map(c =>{
                            const single = c.slice(0,-1);
                            return (
                                <NavDropdown key={`${single}-menu`} title={capitalize(c)} id="request-nav-dropdown" alignRight>
                                    <MenuCounts menu={c} showOn="menu" showNew/>
                                    <NavDropdown.Divider/>
                                    <NavDropdown.Item as={Link} to={`/${single}/list`}>My {capitalize(c)}</NavDropdown.Item>
                                    <NavDropdown.Item as={Link} to={`/${single}/journal`}>{capitalize(c)} Journal</NavDropdown.Item>
                                </NavDropdown>
                            );
                        })}
                        {(isAdmin && !OVR_SUNY_ID) &&
                        <NavDropdown title="Admin" id="admin-nav-dropdown" alignRight>
                            <NavDropdown.Item as={Link} to="/admin/news">News</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/users">Users</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/groups">Groups</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/departments">Departments</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/lists">Lists</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/hierarchy/request">Request Hierarchy</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/hierarchy/form">Form Hierarchy</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/transactions">Form Transactions</NavDropdown.Item>
                            <NavDropdown.Divider/>
                            <NavDropdown.Item as={Link} to="/admin/templates">Templates</NavDropdown.Item>
                            <NavDropdown.Item as={Link} to="/admin/settings">Settings</NavDropdown.Item>
                        </NavDropdown>}
                        <Nav.Link onClick={logout}>Logout</Nav.Link>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        </header>
    );
}
