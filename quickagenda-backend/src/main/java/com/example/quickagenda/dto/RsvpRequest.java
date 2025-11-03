package com.example.quickagenda.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RsvpRequest {
    private String email;
    private String rsvp; // YES, NO, MAYBE
}
