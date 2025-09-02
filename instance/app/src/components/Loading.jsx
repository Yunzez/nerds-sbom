import './Loading.css';


export default function Loading(props) {
    return (
        <div className="loading">
            {props.loading ? (
                <div className="spinner"></div>
            ) : (
                <span className="checkmark" style={{ color: 'green' }}>✔️</span>
            )}
        </div>
    );
}