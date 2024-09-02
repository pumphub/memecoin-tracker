import React, { useEffect, useState } from 'react';
import '../design/howToUse.css'; // Import the CSS file
import { useCookies } from 'react-cookie';
import Modal from './modal';

function HowToUseCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cookies, setCookie] = useCookies(['howToUseSeen']);
  const [isModalOpen, setIsModalOpen] = useState(!cookies.howToUseSeen);




  const handleClose = () => {
    // Set a cookie to indicate that the user has seen the instructions
    setCookie('howToUseSeen', true, { maxAge: 7 * 24 * 60 * 60 }); // Cookie expires in 7 days
    setIsModalOpen(false);
  };

  const carouselItems = [
    <div className='carousel-item' >
      <h1>Welcome to Roundtripped!</h1>
      <p>Using Roundtripped, you can check all your P&L on memecoins!</p>
      <p>It is especially designed for pumpfun users, who trades with SOL pairs.</p>
      <p style={{fontWeight: "bold"}} >1. Start by Connecting your wallet</p>
      <p style={{fontWeight: "bold"}} >2. If you have more than 10$ Roundtripped in your wallet, you can make a search!</p>
      <p style={{fontWeight: "bold"}} >3. Simply put your wallet address and get your Roundtripped Data!</p>
      <p>Here is a simple introduction that will never shown again once you go through it!</p>

    </div>,
    <div className='carousel-item' >
    <h1>How to Use</h1>
      <p>1. Check plays and see P&L for every token!</p>
      <p>2. Check every transaction by clicking token name!</p>
      <p>3. Check best plays and sort your tokens!</p>
      <p>4. Check holdings and trade it on pumpfun!</p>
      <button className='cookie-button' onClick={handleClose}>Got It!</button>
    </div>]; // Example carousel items


  useEffect(() => {
    showSlide(currentSlide);
    console.log(currentSlide)
  }, [currentSlide]);

  const showSlide = (slideIndex) => {
    const numSlides = carouselItems.length;
    if (slideIndex < 0) {
      slideIndex = numSlides - 1;
    } else if (slideIndex >= numSlides) {
      slideIndex = 0;
    }

    setCurrentSlide(slideIndex);
  };

  const prevSlide = () => {
    showSlide(currentSlide - 1);
  };

  const nextSlide = () => {
    showSlide(currentSlide + 1);
  };

  return (
    <Modal isOpen={isModalOpen} onClose={handleClose}>
      <div className="how-to-use-container">
        <div className="carousel">
          <div className="carousel-inner">
            {carouselItems[currentSlide]}
          </div>
          <button style={currentSlide === 0 ? {display: "none"}: {display: "block"}} className="carousel-control prev" onClick={prevSlide}>&#10094;</button>
          <button style={currentSlide === 1 ? {display: "none"}: {display: "block"}} className="carousel-control next" onClick={nextSlide}>&#10095;</button>
        </div>
      </div>
    </Modal>
  );
}

export default HowToUseCarousel;
