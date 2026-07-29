import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {useState} from "react";

function PasswordReset({ open, handleClose, handleSubmit, loading}) {

    const [username, setUsername] = useState('')

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
                component: 'form',
                onSubmit: async (event) => {
                    event.preventDefault();
                    await handleSubmit(username)
                    handleClose();
                },
                sx: { backgroundImage: 'none' },
            }}
        >
            <DialogTitle>ŞİFRƏMİ UNUTMUŞAM</DialogTitle>
            <DialogContent
                sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
            >
                <DialogContentText>
                    Şifrəni sıfırlamaq üçün istifadəçi adınızı daxil edin.
                </DialogContentText>
                {/*Elektron poçt ünvanınızı*/}
                <Box sx={{mt: 1}}>
                    <TextField
                        disabled={loading}
                        margin="normal"
                        required
                        fullWidth
                        label="İstifadəçi adı"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoFocus
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ pb: 3, px: 3,display:'flex', justifyContent: 'end', alignItems: 'center',gap:'10px' }}>
                <Button onClick={handleClose} disabled={loading}>Ləğv et</Button>
                <Button
                    disabled={loading}
                    onClick={(e) => {
                        e.preventDefault()
                        handleSubmit(username)
                    }}
                    variant="contained"

                >
                    Göndər
                </Button>
            </DialogActions>
        </Dialog>
    );
}

PasswordReset.propTypes = {
    handleClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
};

export default PasswordReset;