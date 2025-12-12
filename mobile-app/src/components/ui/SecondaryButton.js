import React from 'react';
import PrimaryButton from './PrimaryButton';

export default function SecondaryButton(props) {
  return <PrimaryButton {...props} variant="secondary" />;
}