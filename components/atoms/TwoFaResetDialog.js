import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

function TwoFAResetDialog({open, handleClose, handleSubmit, loading}) {

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{sx: {backgroundImage: 'none'}}}
        >
            <DialogTitle>AUTENTİFİKASİYA TƏTBİQİNƏ GİRİŞİM YOXDUR</DialogTitle>
            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
                <DialogContentText>
                    Əgər autentifikasiya (Google Authenticator və s.) tətbiqini silmisiniz və ya telefonunuzu
                    dəyişmisiniz/itirmisiniz, iki mərhələli autentifikasiyanızı (2FA) sıfırlaya bilərik.
                    Təsdiqlədikdən sonra hesabınızın e-poçt ünvanına bildiriş göndəriləcək və növbəti
                    daxilolma zamanı sistem sizə yenidən skan etmək üçün yeni QR kod göstərəcək.
                </DialogContentText>
                <DialogContentText sx={{fontSize: 13, color: 'text.secondary'}}>
                    Bu sorğunu siz göndərməmisinizsə, heç bir dəyişiklik edilməyəcək.
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{pb: 3, px: 3, display: 'flex', justifyContent: 'end', alignItems: 'center', gap: '10px'}}>
                <Button onClick={handleClose} disabled={loading}>Ləğv et</Button>
                <Button
                    disabled={loading}
                    onClick={handleSubmit}
                    variant="contained"
                >
                    Təsdiqlə və göndər
                </Button>
            </DialogActions>
        </Dialog>
    );
}

TwoFAResetDialog.propTypes = {
    handleClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    handleSubmit: PropTypes.func.isRequired,
};

export default TwoFAResetDialog;